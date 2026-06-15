export type MemberStage = "NEW" | "ACTIVE" | "AT_RISK" | "CHURNING" | "CHURNED";

export interface LifecycleInput {
  engagementScore: number;
  churnRiskScore: number;
  lastAttendance: Date | null;
  hasActiveSubscription: boolean;
  subscriptionStartDate: Date | null;
}

export interface LifecycleOutput {
  stage: MemberStage;
  confidence: number;
  recommendedAction: string[];
}

export function determineMemberLifecycle(input: LifecycleInput): LifecycleOutput {
  const { engagementScore, churnRiskScore, lastAttendance, hasActiveSubscription, subscriptionStartDate } = input;
  const now = new Date();

  if (!hasActiveSubscription) {
    return {
      stage: "CHURNED",
      confidence: 100,
      recommendedAction: ["SEND_WINBACK_OFFER", "REMOVE_FROM_ACTIVE_ROSTER"]
    };
  }

  // Check NEW status (first 7 days of subscription)
  if (subscriptionStartDate) {
    const daysSinceStart = (now.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceStart <= 7) {
      const isInactive = !lastAttendance || (now.getTime() - lastAttendance.getTime()) / (1000 * 60 * 60 * 24) > 3;
      return {
        stage: "NEW",
        confidence: 90,
        recommendedAction: isInactive ? ["SEND_ONBOARDING_REMINDER"] : ["SEND_WELCOME_MESSAGE"]
      };
    }
  }

  // CHURNING (High Risk)
  if (churnRiskScore > 60) {
    return {
      stage: "CHURNING",
      confidence: Math.min(100, churnRiskScore),
      recommendedAction: ["SEND_URGENT_WINBACK_OFFER", "ALERT_MANAGER"]
    };
  }

  // AT_RISK (Medium Risk)
  if (churnRiskScore >= 30 && churnRiskScore <= 60) {
    return {
      stage: "AT_RISK",
      confidence: 75,
      recommendedAction: ["SEND_REENGAGEMENT_MESSAGE", "OFFER_TRAINER_SESSION"]
    };
  }

  // ACTIVE
  return {
    stage: "ACTIVE",
    confidence: engagementScore > 0 ? engagementScore : 50,
    recommendedAction: engagementScore >= 80 ? ["OFFER_UPSELL", "REQUEST_REFERRAL"] : ["MAINTAIN_ENGAGEMENT"]
  };
}
