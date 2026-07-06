import { Clock } from "@/lib/time/Clock";
import { systemClock } from "@/lib/time/SystemClock";
import { SubscriptionAnalyticsRepository } from "./subscriptionAnalyticsRepository";
import { SubscriptionAnalyticsDTO, TrendGranularity } from "./types";

export class SubscriptionAnalyticsService {
  constructor(
    private readonly repository: SubscriptionAnalyticsRepository,
    private readonly clock: Clock = systemClock
  ) {}

  async getDashboardMetrics(
    tenantId: string,
    from: Date,
    to: Date,
    granularity: TrendGranularity,
    recoveryWindowDays: number = 14
  ): Promise<SubscriptionAnalyticsDTO> {
    // 1. Fetch raw metrics concurrently
    const [
      renewalStats,
      retentionStats,
      recoveryStats,
      expiringTrend,
      averageLifetimeMonths,
      upcomingRevenueAtRisk,
      distribution
    ] = await Promise.all([
      this.repository.getRenewalStats(tenantId, from, to),
      this.repository.getRetentionStats(tenantId, from, to),
      this.repository.getRecoveryStats(tenantId, from, to, recoveryWindowDays),
      this.repository.getExpiringTrend(tenantId, from, to, granularity),
      this.repository.getAverageLifetimeMonths(tenantId),
      this.repository.getUpcomingRevenueAtRisk(tenantId, 30),
      this.repository.getSubscriptionDistribution(tenantId),
    ]);

    // 2. Calculate percentages safely
    const renewalRate = renewalStats.eligible > 0
      ? (renewalStats.renewed / renewalStats.eligible) * 100
      : 0;

    const retentionRate = retentionStats.activeAtStart > 0
      ? ((retentionStats.activeAtEnd - retentionStats.newDuringPeriod) / retentionStats.activeAtStart) * 100
      : 0;

    const recoveryRate = recoveryStats.totalFailures > 0
      ? (recoveryStats.recovered / recoveryStats.totalFailures) * 100
      : 0;

    // 3. Assemble DTO
    return {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        granularity,
      },
      generatedAt: this.clock.now().toISOString(),
      
      renewalRate: Math.round(renewalRate * 100) / 100, // Round to 2 decimals
      retentionRate: Math.round(retentionRate * 100) / 100,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      
      averageLifetimeMonths: Math.round(averageLifetimeMonths * 10) / 10, // Round to 1 decimal
      upcomingRevenueAtRisk,
      
      expiringTrend,
      distribution,
    };
  }
}
