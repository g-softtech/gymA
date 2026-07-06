export type TrendGranularity = "day" | "week" | "month";

export interface SubscriptionTrendPeriod {
  period: string; // ISO string date representation of the period start (e.g. '2023-10-01')
  count: number;
}

export interface SubscriptionDistribution {
  planId: string;
  planName: string;
  count: number;
}

export interface SubscriptionAnalyticsDTO {
  period: {
    from: string; // ISO String
    to: string; // ISO String
    granularity: TrendGranularity;
  };
  
  generatedAt: string; // ISO String

  renewalRate: number; // Percentage (0-100)
  retentionRate: number; // Percentage (0-100)
  recoveryRate: number; // Percentage (0-100)
  
  averageLifetimeMonths: number;
  upcomingRevenueAtRisk: number; // Naira/Currency amount
  
  expiringTrend: SubscriptionTrendPeriod[];
  distribution: SubscriptionDistribution[];
}
