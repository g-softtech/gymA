import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, requireAdmin, noTenantContext } from "@/lib/tenant";
import { subscriptionDomainBus, createSubscriptionEvent } from "@/lib/subscriptions/events";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
/**
 * GET /api/member/subscription
 *
 * Returns the current active subscription for the authenticated member.
 * Also returns the most recent inactive subscription if no active one exists
 * (so the member knows they need to renew).
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!memberProfile) {
      return NextResponse.json({ subscription: null, hasProfile: false });
    }

    // Active subscription
    const active = await prisma.subscription.findFirst({
      where: {
        memberId: memberProfile.id,
        tenantId: ctx.tenantId,
        status: "ACTIVE",
      },
      include: {
        plan: {
          select: { name: true, price: true, durationDays: true, features: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Most recent past subscription (for renewal prompt)
    const latest = active
      ? null
      : await prisma.subscription.findFirst({
          where: {
            memberId: memberProfile.id,
            tenantId: ctx.tenantId,
          },
          include: {
            plan: {
              select: { id: true, name: true, price: true, durationDays: true },
            },
          },
          orderBy: { endDate: "desc" },
        });

    return NextResponse.json({
      hasProfile: true,
      subscription: active ?? null,
      latestExpired: latest ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/member/subscription
 *
 * Admin-only: cancel or manually activate a subscription.
 * Body: { subscriptionId, action: "cancel" | "activate" }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { subscriptionId, action } = await req.json();

    if (!subscriptionId || !["cancel", "activate"].includes(action)) {
      return NextResponse.json(
        { error: "subscriptionId and action (cancel|activate) are required" },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to this tenant
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { member: { include: { user: { select: { id: true } } } }, plan: { select: { name: true } } },
    });

    if (!sub || sub.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const newStatus = action === "cancel" ? "CANCELLED" : "ACTIVE";
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: newStatus },
    });

    const eventType = action === "cancel" ? "SubscriptionCancelled" : "SubscriptionActivated";
    
    await subscriptionDomainBus.publish(
      createSubscriptionEvent({
        type: eventType as any,
        tenantId: ctx.tenantId,
        correlationId: `admin-patch-${subscriptionId}-${Date.now()}`,
        actorId: session?.user?.id || "system.admin",
        source: "admin.portal",
        payload: {
          subscriptionId: subscriptionId,
          memberId: sub.memberId,
          planId: sub.planId,
          reason: `Admin requested ${action}`,
          previousStatus: sub.status,
          newStatus: newStatus,
        },
      })
    );

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
