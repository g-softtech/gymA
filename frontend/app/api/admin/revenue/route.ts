import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * GET /api/admin/revenue?period=monthly|yearly|alltime
 * Returns tenant-scoped revenue analytics.
 * ADMIN / SUPERADMIN only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const period = req.nextUrl.searchParams.get("period") ?? "monthly";

    // Date range
    const now = new Date();
    let fromDate: Date;
    if (period === "yearly") {
      fromDate = new Date(now.getFullYear(), 0, 1); // Jan 1 this year
    } else if (period === "alltime") {
      fromDate = new Date(0);
    } else {
      // monthly: current calendar month
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      activeSubscriptions,
      cancelledSubscriptions,
      allPlans,
      subscriptionsByPlan,
    ] = await Promise.all([
      // Active subscriptions in tenant
      prisma.subscription.count({
        where: { tenantId: ctx.tenantId, status: "ACTIVE" },
      }),
      // Cancelled this period
      prisma.subscription.count({
        where: {
          tenantId: ctx.tenantId,
          status: "CANCELLED",
          startDate: { gte: fromDate },
        },
      }),
      // All membership plans in tenant
      prisma.membershipPlan.findMany({
        where: { tenantId: ctx.tenantId },
        select: { id: true, name: true, price: true, durationDays: true },
      }),
      // Subscriptions grouped by plan (all-time active)
      prisma.subscription.groupBy({
        by: ["planId"],
        where: { tenantId: ctx.tenantId, status: "ACTIVE" },
        _count: { _all: true },
      }),
    ]);

    // Build revenue by plan — using active subscription count × plan price as MRR approximation
    const planMap = new Map(allPlans.map((p) => [p.id, p]));
    const revenueByPlan = subscriptionsByPlan.map((s) => {
      const plan = planMap.get(s.planId);
      const subscriptionCount = s._count._all;
      // Annualise: price * (30 / durationDays) ≈ monthly value per subscription
      const monthlyValuePerSub = plan
        ? Number(plan.price) * (30 / (plan.durationDays || 30))
        : 0;
      return {
        planId: s.planId,
        planName: plan?.name ?? "Unknown",
        price: plan ? Number(plan.price) : 0,
        durationDays: plan?.durationDays ?? 30,
        subscriptionCount,
        estimatedMRR: Math.round(monthlyValuePerSub * subscriptionCount),
      };
    });

    const totalEstimatedMRR = revenueByPlan.reduce(
      (sum, p) => sum + p.estimatedMRR,
      0
    );

    // Total subscriptions started in period (new revenue events)
    const newSubscriptions = await prisma.subscription.count({
      where: {
        tenantId: ctx.tenantId,
        startDate: { gte: fromDate },
      },
    });

    // Churn rate: cancelled / (active + cancelled) in period
    const totalInPeriod = activeSubscriptions + cancelledSubscriptions;
    const churnRate =
      totalInPeriod > 0
        ? Math.round((cancelledSubscriptions / totalInPeriod) * 100)
        : 0;

    return NextResponse.json({
      period,
      fromDate: fromDate.toISOString(),
      activeSubscriptions,
      newSubscriptions,
      cancelledSubscriptions,
      churnRate,
      totalEstimatedMRR,
      revenueByPlan,
      plans: allPlans,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
