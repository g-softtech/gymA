import { prisma } from "@/lib/prisma";
import { Clock } from "@/lib/time/Clock";
import { TrendGranularity } from "./types";
import { Prisma } from "@prisma/client";

export class SubscriptionAnalyticsRepository {
  constructor(private readonly clock: Clock) {}

  async getRenewalStats(tenantId: string, from: Date, to: Date) {
    // Numerator: Subscriptions with a SUCCESSFUL activation/renewal in this period
    // Since we are looking at canonical data, we consider a subscription "renewed" if it 
    // has a startDate falling in this period AND was previously EXPIRED or replacing an EXPIRED one.
    // However, the cleanest way in this specific schema is to find subscriptions that expired in this period
    // and check if that member has an active subscription now.
    
    // Eligible for renewal: Subscriptions that reached their end date within the [from, to] period.
    const eligibleCount = await prisma.subscription.count({
      where: {
        tenantId,
        endDate: { gte: from, lte: to },
        status: { in: ["ACTIVE", "EXPIRED", "REPLACED", "CANCELLED"] }, 
        // Note: Even if CANCELLED, if the end date falls in this period, it could have been eligible.
        // We will exclude CANCELLED per the business rules if they cancelled BEFORE natural expiry.
      },
    });

    // To accurately count the renewed subset (Denominator = eligible), we'll use a slightly more advanced query
    // since Prisma doesn't support self-joins easily. We will query eligible subscriptions, then see how many have 
    // a subsequent active subscription.
    // Given the constraints: "Never execute six independent full-table scans", we use raw SQL.
    const result = await prisma.$queryRaw<{ eligible: number; renewed: number }[]>`
      WITH eligible AS (
        SELECT "memberId"
        FROM "Subscription"
        WHERE "tenantId" = ${tenantId}
          AND "endDate" >= ${from}
          AND "endDate" <= ${to}
          AND "status" != 'CANCELLED'
      )
      SELECT 
        COUNT(DISTINCT e."memberId")::int as eligible,
        COUNT(DISTINCT s."memberId")::int as renewed
      FROM eligible e
      LEFT JOIN "Subscription" s 
        ON s."memberId" = e."memberId" 
        AND s."status" = 'ACTIVE' 
        AND s."endDate" > ${to}
    `;

    return {
      eligible: result[0]?.eligible || 0,
      renewed: result[0]?.renewed || 0,
    };
  }

  async getRetentionStats(tenantId: string, from: Date, to: Date) {
    // Active at Start: Subscriptions that started <= from AND ended > from
    const activeAtStart = await prisma.subscription.count({
      where: {
        tenantId,
        startDate: { lte: from },
        endDate: { gt: from },
        status: { notIn: ["CANCELLED", "PENDING_PAYMENT"] }
      }
    });

    // Active at End: Subscriptions that started <= to AND ended > to
    const activeAtEnd = await prisma.subscription.count({
      where: {
        tenantId,
        startDate: { lte: to },
        endDate: { gt: to },
        status: { notIn: ["CANCELLED", "PENDING_PAYMENT"] }
      }
    });

    // New during period: First-time activations. We approximate this by counting subscriptions 
    // starting in this period where the member has no older subscriptions.
    const newDuringPeriodResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count
      FROM "Subscription" s1
      WHERE s1."tenantId" = ${tenantId}
        AND s1."startDate" >= ${from}
        AND s1."startDate" <= ${to}
        AND NOT EXISTS (
          SELECT 1 FROM "Subscription" s2 
          WHERE s2."memberId" = s1."memberId" 
            AND s2."startDate" < s1."startDate"
        )
    `;

    return {
      activeAtStart,
      activeAtEnd,
      newDuringPeriod: newDuringPeriodResult[0]?.count || 0,
    };
  }

  async getRecoveryStats(tenantId: string, from: Date, to: Date, windowDays: number) {
    // Recovered if a failed transaction has a subsequent successful one for same member/plan within window
    const result = await prisma.$queryRaw<{ failures: number; recovered: number }[]>`
      SELECT 
        COUNT(DISTINCT f.id)::int as failures,
        COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN f.id END)::int as recovered
      FROM "Transaction" f
      LEFT JOIN "Transaction" s 
        ON s."memberId" = f."memberId" 
        AND s.status = 'SUCCESS'
        AND s."createdAt" > f."createdAt"
        AND s."createdAt" <= f."createdAt" + interval '1 day' * ${windowDays}
      WHERE f."tenantId" = ${tenantId}
        AND f.status = 'FAILED'
        AND f."createdAt" >= ${from}
        AND f."createdAt" <= ${to}
    `;

    return {
      totalFailures: result[0]?.failures || 0,
      recovered: result[0]?.recovered || 0,
    };
  }

  async getExpiringTrend(tenantId: string, from: Date, to: Date, granularity: TrendGranularity) {
    const truncMap = {
      day: "day",
      week: "week",
      month: "month"
    };

    const truncFormat = truncMap[granularity] || "month";

    const result = await prisma.$queryRaw<{ period: Date; count: number }[]>`
      SELECT 
        date_trunc(${truncFormat}, "endDate") as period,
        COUNT(id)::int as count
      FROM "Subscription"
      WHERE "tenantId" = ${tenantId}
        AND "status" = 'ACTIVE'
        AND "endDate" >= ${from}
        AND "endDate" <= ${to}
      GROUP BY period
      ORDER BY period ASC
    `;

    return result.map(r => ({
      period: r.period.toISOString(),
      count: r.count,
    }));
  }

  async getAverageLifetimeMonths(tenantId: string) {
    // Average continuous duration: average of (endDate - startDate) across all subscriptions
    // In our domain, we define this as the difference between the earliest startDate and the latest endDate
    // for each member.
    const result = await prisma.$queryRaw<{ avg_months: number }[]>`
      WITH MemberDurations AS (
        SELECT 
          "memberId",
          MIN("startDate") as first_start,
          MAX(CASE WHEN "endDate" > NOW() THEN NOW() ELSE "endDate" END) as last_end
        FROM "Subscription"
        WHERE "tenantId" = ${tenantId}
          AND "status" != 'PENDING_PAYMENT'
        GROUP BY "memberId"
      )
      SELECT 
        AVG(EXTRACT(EPOCH FROM (last_end - first_start)) / (30 * 24 * 60 * 60))::float as avg_months
      FROM MemberDurations
      WHERE last_end > first_start
    `;

    return result[0]?.avg_months || 0;
  }

  async getUpcomingRevenueAtRisk(tenantId: string, riskWindowDays: number = 30) {
    const now = this.clock.now();
    const riskEnd = new Date(now.getTime() + riskWindowDays * 24 * 60 * 60 * 1000);

    const result = await prisma.$queryRaw<{ revenue: number }[]>`
      SELECT 
        SUM(p."price")::float as revenue
      FROM "Subscription" s
      JOIN "MembershipPlan" p ON s."planId" = p.id
      WHERE s."tenantId" = ${tenantId}
        AND s."status" = 'ACTIVE'
        AND s."endDate" > ${now}
        AND s."endDate" <= ${riskEnd}
    `;

    return result[0]?.revenue || 0;
  }

  async getSubscriptionDistribution(tenantId: string) {
    const result = await prisma.$queryRaw<{ planId: string; name: string; count: number }[]>`
      SELECT 
        p.id as "planId",
        p.name,
        COUNT(s.id)::int as count
      FROM "MembershipPlan" p
      LEFT JOIN "Subscription" s 
        ON s."planId" = p.id 
        AND s."status" = 'ACTIVE'
        AND s."tenantId" = ${tenantId}
      WHERE p."tenantId" = ${tenantId}
      GROUP BY p.id, p.name
      ORDER BY count DESC
    `;

    return result.map(r => ({
      planId: r.planId,
      planName: r.name,
      count: r.count,
    }));
  }
}
