import { prisma } from "@/lib/prisma";

export async function getMRR(tenantId: string) {
  // Sum the price of all active subscriptions
  const activeSubs = await prisma.subscription.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
    },
    include: {
      plan: {
        select: { price: true },
      },
    },
  });

  const mrr = activeSubs.reduce((acc, sub) => {
    return acc + Number(sub.plan.price);
  }, 0);

  return mrr;
}

export async function getRevenueByPlan(tenantId: string) {
  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
      },
    },
  });

  return plans.map((p) => ({
    planId: p.id,
    planName: p.name,
    mrr: p.subscriptions.length * Number(p.price),
    activeSubscribers: p.subscriptions.length,
  }));
}

export async function getChurnRate(tenantId: string) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Users who had an active subscription that ended and wasn't renewed this month
  const churnedSubs = await prisma.subscription.count({
    where: {
      tenantId,
      status: "CANCELLED",
      endDate: {
        gte: startOfThisMonth,
        lte: now,
      },
    },
  });

  // Total active at start of month (approximation: current active + churned)
  const activeSubs = await prisma.subscription.count({
    where: {
      tenantId,
      status: "ACTIVE",
    },
  });

  const cohort = activeSubs + churnedSubs;
  if (cohort === 0) return 0;

  return Math.round((churnedSubs / cohort) * 100);
}

export async function getAverageRevenuePerMember(tenantId: string) {
  const mrr = await getMRR(tenantId);
  const activeSubs = await prisma.subscription.count({
    where: {
      tenantId,
      status: "ACTIVE",
    },
  });

  if (activeSubs === 0) return 0;
  return Math.round(mrr / activeSubs);
}

export async function getRevenueTrend(tenantId: string, months: number = 6) {
  const trend = [];
  const now = new Date();

  // Very simplified trend: for a real billing system like Stripe, you'd aggregate invoices.
  // Since we use SaaSInvoices and Payments, we aggregate Transactions or PaymentEvents.
  // We'll aggregate Transaction for 'SUCCESS' status.
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        tenantId,
        status: "SUCCESS",
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    trend.push({
      month: start.toLocaleString('default', { month: 'short' }),
      revenue: Number(result._sum.amount || 0),
    });
  }

  return trend;
}
