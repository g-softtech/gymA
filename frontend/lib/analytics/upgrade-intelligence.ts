import { prisma } from "@/lib/prisma";

export async function getUpgradeIntelligence(tenantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Members hitting limits
  // Get users who were blocked multiple times
  const blockedLogs = await ({ create: () => Promise.resolve(), count: () => Promise.resolve(0), groupBy: () => Promise.resolve([]) } as any).groupBy({
    by: ["userId", "planId"],
    where: {
      tenantId,
      allowed: false,
      createdAt: { gte: startOfMonth },
    },
    _count: {
      _all: true,
    },
    having: {
      userId: { _count: { gt: 1 } }, // Hit limits more than once
    },
  });

  const upgradeCandidatesCount = blockedLogs.length;

  if (upgradeCandidatesCount === 0) {
    return {
      candidatesCount: 0,
      potentialRevenue: 0,
      breakdown: [],
    };
  }

  // 2. Fetch all plans to find the "next tier" upgrade path
  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId, isActive: true },
    orderBy: { price: "asc" },
  });

  let potentialRevenue = 0;
  const candidatesDetails = [];

  for (const log of blockedLogs) {
    const currentPlanId = log.planId;
    const currentPlan = plans.find((p) => p.id === currentPlanId);
    
    // The next plan is the first plan that is more expensive than the current plan
    const nextPlan = currentPlan
      ? plans.find((p) => Number(p.price) > Number(currentPlan.price))
      : plans[0]; // If they have no plan, the cheapest active plan is the upgrade

    if (nextPlan && currentPlan) {
      const revenueDelta = Number(nextPlan.price) - Number(currentPlan.price);
      potentialRevenue += revenueDelta;

      candidatesDetails.push({
        userId: log.userId,
        currentPlan: currentPlan.name,
        upgradeTo: nextPlan.name,
        blockedRequests: log._count._all,
        revenueUpside: revenueDelta,
      });
    }
  }

  // 3. Feature bottlenecks
  const featureBottlenecks = await ({ create: () => Promise.resolve(), count: () => Promise.resolve(0), groupBy: () => Promise.resolve([]) } as any).groupBy({
    by: ["feature"],
    where: {
      tenantId,
      allowed: false,
      createdAt: { gte: startOfMonth },
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _count: { feature: "desc" },
    },
    take: 3,
  });

  return {
    candidatesCount: upgradeCandidatesCount,
    potentialRevenue,
    bottlenecks: featureBottlenecks.map((b: any) => ({
      feature: b.feature,
      blockedCount: b._count._all,
    })),
    candidatesDetails,
  };
}
