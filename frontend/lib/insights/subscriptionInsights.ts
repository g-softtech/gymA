import { SubscriptionAnalyticsDTO } from "../subscriptions/analytics/types";

export type InsightSeverity = "info" | "warning" | "success" | "critical";

export interface SubscriptionInsight {
  id: string;
  severity: InsightSeverity;
  message: string;
  actionableRecommendation?: string;
}

/**
 * Pure function to generate SaaS-grade business insights from raw metrics.
 * Decoupled from the UI to ensure business rules remain in the domain layer.
 */
export function generateSubscriptionInsights(metrics: SubscriptionAnalyticsDTO): SubscriptionInsight[] {
  const insights: SubscriptionInsight[] = [];

  // 1. Revenue Risk
  if (metrics.upcomingRevenueAtRisk > 0) {
    insights.push({
      id: "revenue-risk",
      severity: metrics.upcomingRevenueAtRisk > 50000 ? "critical" : "warning",
      message: `₦${metrics.upcomingRevenueAtRisk.toLocaleString()} in MRR is at risk of expiring in the next 30 days.`,
      actionableRecommendation: "Consider sending an early renewal discount to expiring members.",
    });
  }

  // 2. Renewal Rate Health
  if (metrics.renewalRate >= 90) {
    insights.push({
      id: "renewal-health-high",
      severity: "success",
      message: `Exceptional renewal rate! ${metrics.renewalRate}% of eligible subscriptions were renewed.`,
    });
  } else if (metrics.renewalRate > 0 && metrics.renewalRate < 60) {
    insights.push({
      id: "renewal-health-low",
      severity: "critical",
      message: `Your renewal rate is dropping (${metrics.renewalRate}%).`,
      actionableRecommendation: "Investigate if recent pricing changes or service disruptions caused churn.",
    });
  }

  // 3. Retention Rate
  if (metrics.retentionRate < 80 && metrics.retentionRate > 0) {
    insights.push({
      id: "retention-drop",
      severity: "warning",
      message: `Overall member retention has fallen below 80%.`,
      actionableRecommendation: "Check in with your older members to boost engagement.",
    });
  }

  // 4. Payment Recovery
  if (metrics.recoveryRate < 50 && metrics.recoveryRate > 0) {
    insights.push({
      id: "recovery-low",
      severity: "warning",
      message: `Only ${metrics.recoveryRate}% of failed payments are being successfully recovered.`,
      actionableRecommendation: "Ensure automated dunning emails and payment retries are enabled.",
    });
  }

  // 5. Member Lifetime
  if (metrics.averageLifetimeMonths > 0 && metrics.averageLifetimeMonths < 3) {
    insights.push({
      id: "lifetime-low",
      severity: "warning",
      message: `Members are churning quickly, staying for an average of just ${metrics.averageLifetimeMonths} months.`,
      actionableRecommendation: "Focus on the first 30 days of member onboarding to increase long-term stickiness.",
    });
  }

  return insights;
}
