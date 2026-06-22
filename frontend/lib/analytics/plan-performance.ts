import { prisma } from "@/lib/prisma";

export async function getPlanPerformance(tenantId: string) {
  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
      },
      entitlementLogs: {
        where: {
          allowed: false,
        },
      },
    },
  });

  return plans.map((plan) => {
    const activeMembers = plan.subscriptions.length;
    const revenue = activeMembers * Number(plan.price);
    const blockedRequests = plan.entitlementLogs.length; // Count of blocked requests historically or this month

    return {
      planId: plan.id,
      planName: plan.name,
      activeMembers,
      revenue,
      blockedRequests,
    };
  });
}
