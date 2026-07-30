import { prisma } from "@/lib/prisma";
import { enqueueEmail } from "@/lib/email/emailQueue";

import { EXPIRY_WARNING_DAYS } from "@/lib/billing/pricingConfig";

// Helper to check if we already sent a notification today
async function hasSentNotificationToday(userId: string, titlePrefix: string) {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: "SUBSCRIPTION_EXPIRY",
      title: { startsWith: titlePrefix },
      createdAt: { gte: yesterday },
    },
  });

  return !!existing;
}

export async function processExpiringSubscriptions() {
  const now = new Date();
  const warningDate = new Date();
  warningDate.setDate(now.getDate() + EXPIRY_WARNING_DAYS);

  // Find subscriptions expiring in <= EXPIRY_WARNING_DAYS that are still ACTIVE
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        lte: warningDate,
        gt: now, // Not expired yet
      },
    },
    include: {
      member: { include: { user: true } },
      plan: true,
      tenant: true,
    },
  });

  for (const sub of expiringSoon) {
    const user = sub.member.user;
    if (!user || !user.email) continue;

    // Idempotency check: don't spam them every day for the 3 days, just once per day max (or actually once per transition). 
    // We check if we sent "Expiring Soon" in the last 24 hours.
    if (await hasSentNotificationToday(user.id, "Expiring Soon")) {
      continue;
    }

    await enqueueEmail({
      emailType: "MEMBERSHIP_EXPIRING",
      recipient: user.email,
      subject: `Your Membership is Expiring Soon`,
      tenantId: sub.tenantId,
      payload: {
        memberName: user.name || "Member",
        daysLeft: Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        gymName: sub.tenant.name,
      }
    });

    await prisma.notification.create({
      data: {
        tenantId: sub.tenantId,
        userId: user.id,
        type: "SUBSCRIPTION_EXPIRY",
        title: "Expiring Soon: Membership",
        message: `Your ${sub.plan.name} membership expires on ${sub.endDate.toLocaleDateString()}.`,
      },
    });
  }

  // Find subscriptions that have expired (endDate < now) but are still marked ACTIVE
  // We don't mutate status, we just notify. We rely on queries to compute status.
  const expired = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE", // Assuming we want to notify those who haven't renewed
      endDate: {
        lte: now,
      },
    },
    include: {
      member: { include: { user: true } },
      plan: true,
      tenant: true,
    },
  });

  for (const sub of expired) {
    const user = sub.member.user;
    if (!user || !user.email) continue;

    // Idempotency: Don't send expired notification repeatedly every day. 
    // We check if "Expired" was sent in the last 24 hours.
    if (await hasSentNotificationToday(user.id, "Expired")) {
      continue;
    }

    // Additionally, check if they have a newer active subscription (early renewal Option A)
    // If they have one that covers them now, they are not truly expired.
    const hasNewerSub = await prisma.subscription.findFirst({
      where: {
        memberId: sub.memberId,
        tenantId: sub.tenantId,
        status: "ACTIVE",
        endDate: { gt: now },
      }
    });

    if (hasNewerSub) {
      continue; // They already renewed, ignore the old expired one
    }

    await enqueueEmail({
      emailType: "MEMBERSHIP_EXPIRING", // or EXPIRED if we create one, but for now reuse or rely on existing templates
      recipient: user.email,
      subject: `Your Membership has Expired`,
      tenantId: sub.tenantId,
      payload: {
        memberName: user.name || "Member",
        daysLeft: 0,
        gymName: sub.tenant.name,
      }
    });

    await prisma.notification.create({
      data: {
        tenantId: sub.tenantId,
        userId: user.id,
        type: "SUBSCRIPTION_EXPIRY",
        title: "Expired: Membership",
        message: `Your ${sub.plan.name} membership expired on ${sub.endDate.toLocaleDateString()}.`,
      },
    });
  }

  return {
    expiringProcessed: expiringSoon.length,
    expiredProcessed: expired.length,
  };
}
