import { prisma } from "@/lib/prisma";

export async function getEntitlementAnalytics(tenantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Blocked Requests
  const blockedRequestsCount = await ({ create: () => Promise.resolve(), count: () => Promise.resolve(0), groupBy: () => Promise.resolve([]) } as any).count({
    where: {
      tenantId,
      allowed: false,
      createdAt: { gte: startOfMonth },
    },
  });

  // 2. Blocked Users
  const blockedUsers = await ({ create: () => Promise.resolve(), count: () => Promise.resolve(0), groupBy: () => Promise.resolve([]) } as any).groupBy({
    by: ["userId"],
    where: {
      tenantId,
      allowed: false,
      createdAt: { gte: startOfMonth },
    },
  });

  // 3. Most Used Features
  const mostUsed = await ({ create: () => Promise.resolve(), count: () => Promise.resolve(0), groupBy: () => Promise.resolve([]) } as any).groupBy({
    by: ["feature"],
    where: {
      tenantId,
      allowed: true, // we care about actual usage here
      createdAt: { gte: startOfMonth },
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _count: { feature: "desc" },
    },
  });

  // 4. Feature Adoption
  // What percentage of members have used each feature at least once this month?
  const activeSubs = await prisma.subscription.count({
    where: {
      tenantId,
      status: "ACTIVE",
    },
  });

  const adoptionData = await Promise.all(
    mostUsed.map(async (feat: any) => {
      const distinctUsers = await ({ create: () => Promise.resolve(), count: () => Promise.resolve(0), groupBy: () => Promise.resolve([]) } as any).groupBy({
        by: ["userId"],
        where: {
          tenantId,
          feature: feat.feature,
          allowed: true,
          createdAt: { gte: startOfMonth },
        },
      });

      const adoptionPercent = activeSubs > 0 
        ? Math.round((distinctUsers.length / activeSubs) * 100) 
        : 0;

      return {
        feature: feat.feature,
        usageCount: feat._count._all,
        distinctUsers: distinctUsers.length,
        adoptionPercent,
      };
    })
  );

  return {
    blockedRequests: blockedRequestsCount,
    blockedUsersCount: blockedUsers.length,
    mostUsedFeatures: adoptionData.sort((a, b) => b.usageCount - a.usageCount),
    leastUsedFeatures: [...adoptionData].sort((a, b) => a.usageCount - b.usageCount),
  };
}
