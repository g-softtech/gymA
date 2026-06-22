import { prisma } from "@/lib/prisma";

export async function getActiveMembers(tenantId: string) {
  return prisma.memberProfile.count({
    where: {
      user: { tenantId },
      subscriptions: {
        some: { status: "ACTIVE" },
      },
    },
  });
}

export async function getNewMembers(tenantId: string, startDate?: Date) {
  const now = new Date();
  const startOfMonth = startDate || new Date(now.getFullYear(), now.getMonth(), 1);

  return prisma.memberProfile.count({
    where: {
      user: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
    },
  });
}

export async function getMembersByPlan(tenantId: string) {
  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          subscriptions: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
  });

  return plans.map((p) => ({
    planId: p.id,
    planName: p.name,
    activeMembers: p._count.subscriptions,
  }));
}

export async function getRetentionRate(tenantId: string) {
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Members who had an active subscription last month
  const activeLastMonth = await prisma.memberProfile.count({
    where: {
      user: { tenantId },
      subscriptions: {
        some: {
          status: "ACTIVE",
          startDate: { lt: startOfThisMonth },
          OR: [
            { endDate: null },
            { endDate: { gt: startOfLastMonth } }
          ]
        },
      },
    },
  });

  if (activeLastMonth === 0) return 100; // No one to retain

  // Members who are STILL active this month out of the cohort
  const retainedThisMonth = await prisma.memberProfile.count({
    where: {
      user: { tenantId },
      subscriptions: {
        some: {
          status: "ACTIVE",
          startDate: { lt: startOfThisMonth },
        },
      },
      // AND must have an active sub currently
      AND: {
        subscriptions: {
          some: { status: "ACTIVE" }
        }
      }
    },
  });

  return Math.round((retainedThisMonth / activeLastMonth) * 100);
}
