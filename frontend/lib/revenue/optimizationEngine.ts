export interface RevenueTarget {
  id: string; // trainerId, classSessionId, or memberId
  type: "TRAINER" | "CLASS" | "MEMBER";
  performanceScore?: number;
  utilizationRate?: number;
  engagementScore?: number;
  ltvScore?: number; // Normalized lifetime value relative to engagement
}

export interface RevenueRecommendation {
  type: "PRICE_INCREASE" | "DISCOUNT" | "BUNDLE" | "MEMBERSHIP_UPGRADE";
  targetId: string;
  targetType: "TRAINER" | "CLASS" | "MEMBER";
  reason: string;
  expectedImpact: string;
}

export function evaluateRevenueOpportunities(targets: RevenueTarget[]): RevenueRecommendation[] {
  const recommendations: RevenueRecommendation[] = [];

  for (const target of targets) {
    if (target.type === "TRAINER" && target.performanceScore !== undefined && target.utilizationRate !== undefined) {
      if (target.performanceScore > 80 && target.utilizationRate > 90) {
        recommendations.push({
          type: "PRICE_INCREASE",
          targetId: target.id,
          targetType: "TRAINER",
          reason: `Trainer has extremely high performance (${target.performanceScore}) and utilization (${target.utilizationRate}%).`,
          expectedImpact: "Increase margin per session without significant drop in demand."
        });
      } else if (target.utilizationRate < 30) {
        recommendations.push({
          type: "BUNDLE",
          targetId: target.id,
          targetType: "TRAINER",
          reason: `Trainer utilization is critically low (${target.utilizationRate}%).`,
          expectedImpact: "Package their sessions with memberships to increase booking volume."
        });
      }
    }

    if (target.type === "CLASS" && target.utilizationRate !== undefined) {
      if (target.utilizationRate < 30) {
        recommendations.push({
          type: "DISCOUNT",
          targetId: target.id,
          targetType: "CLASS",
          reason: `Class utilization is poor (${target.utilizationRate}%).`,
          expectedImpact: "Fill empty slots by offering a temporary discount or bundle."
        });
      }
    }

    if (target.type === "MEMBER" && target.engagementScore !== undefined && target.ltvScore !== undefined) {
      // High engagement but low LTV implies they attend often but are on a basic/cheap plan.
      if (target.engagementScore > 80 && target.ltvScore < 40) {
        recommendations.push({
          type: "MEMBERSHIP_UPGRADE",
          targetId: target.id,
          targetType: "MEMBER",
          reason: `Highly engaged member (${target.engagementScore} score) with below-average lifetime value.`,
          expectedImpact: "Upsell to a premium membership to match their high facility usage."
        });
      }
    }
  }

  return recommendations;
}
