import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/subscriptions
 *
 * Subscription expiry cron job.
 *
 * Runs daily via Vercel Cron (configured in vercel.json).
 * Finds all ACTIVE subscriptions whose endDate has passed and marks them
 * as INACTIVE. Also creates an expiry notification for the member.
 *
 * Security: Protected by CRON_SECRET header — only Vercel's cron system
 * (and your own curl with the secret) should be able to call this.
 *
 * Required env var: CRON_SECRET
 */
export async function GET(req: NextRequest) {
  // ── 1. Verify cron secret ──────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  console.log(`[cron/subscriptions] Running at ${now.toISOString()}`);

  // ── 2. Find all expired ACTIVE subscriptions ───────────────────────────────
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
    },
    include: {
      member: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      plan: { select: { name: true } },
    },
  });

  console.log(`[cron/subscriptions] Found ${expiredSubscriptions.length} expired subscription(s)`);

  if (expiredSubscriptions.length === 0) {
    return NextResponse.json({ expired: 0, warned: 0 });
  }

  // ── 3. Expire them in a transaction ───────────────────────────────────────
  let expiredCount = 0;
  let errorCount = 0;

  for (const sub of expiredSubscriptions) {
    try {
      await prisma.$transaction([
        // Mark as EXPIRED
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        }),
        // Create expiry notification for the member
        prisma.notification.create({
          data: {
            tenantId: sub.tenantId,
            userId: sub.member.user.id,
            type: "SUBSCRIPTION_EXPIRY",
            title: "Membership Expired",
            message: `Your ${sub.plan.name} membership has expired. Renew now to continue accessing gym services.`,
          },
        }),
      ]);
      expiredCount++;
    } catch (err) {
      console.error(`[cron/subscriptions] Failed to expire subscription ${sub.id}:`, err);
      errorCount++;
    }
  }

  // ── 4. Also send 3-day expiry warning notifications ────────────────────────
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + 3);

  const soonToExpire = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gte: now,
        lte: warningDate,
      },
    },
    include: {
      member: {
        include: {
          user: { select: { id: true } },
        },
      },
      plan: { select: { name: true, price: true } },
    },
  });

  let warnedCount = 0;
  for (const sub of soonToExpire) {
    try {
      const daysLeft = Math.ceil(
        (sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only warn once — check if a warning notification was already sent today
      const existingWarning = await prisma.notification.findFirst({
        where: {
          userId: sub.member.user.id,
          type: "SUBSCRIPTION_EXPIRY",
          title: { contains: "expiring" },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      });

      if (!existingWarning) {
        await prisma.notification.create({
          data: {
            tenantId: sub.tenantId,
            userId: sub.member.user.id,
            type: "SUBSCRIPTION_EXPIRY",
            title: `Membership Expiring in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} ⏰`,
            message: `Your ${sub.plan.name} membership expires on ${sub.endDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}. Renew now to avoid interruption.`,
          },
        });
        warnedCount++;
      }
    } catch (err) {
      console.error(`[cron/subscriptions] Warning notification failed for sub ${sub.id}:`, err);
    }
  }

  const result = {
    ran_at: now.toISOString(),
    expired: expiredCount,
    warned: warnedCount,
    errors: errorCount,
  };

  console.log(`[cron/subscriptions] Done:`, result);
  return NextResponse.json(result);
}
