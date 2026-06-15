import { MemberStage } from "../lifecycle/memberLifecycle";

export interface RetentionTriggerInput {
  stage: MemberStage;
  churnRiskScore: number;
  engagementScore: number;
  daysSinceLastAttendance: number | null;
}

export interface RetentionAction {
  actionType: "WIN_BACK_OFFER" | "REENGAGEMENT_MESSAGE" | "ONBOARDING_REMINDER" | "UPSELL_MEMBERSHIP" | "NONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  context: string;
}

export function evaluateRetentionTriggers(input: RetentionTriggerInput): RetentionAction {
  const { stage, churnRiskScore, engagementScore, daysSinceLastAttendance } = input;

  if (churnRiskScore > 60 || stage === "CHURNING") {
    return {
      actionType: "WIN_BACK_OFFER",
      priority: "HIGH",
      context: "User is at high risk of churning."
    };
  }

  if (stage === "ACTIVE" || stage === "AT_RISK") {
    if (daysSinceLastAttendance !== null && daysSinceLastAttendance >= 14) {
      return {
        actionType: "REENGAGEMENT_MESSAGE",
        priority: "MEDIUM",
        context: "User has been inactive for 14+ days."
      };
    }
  }

  if (stage === "NEW" && (daysSinceLastAttendance === null || daysSinceLastAttendance >= 3)) {
    return {
      actionType: "ONBOARDING_REMINDER",
      priority: "HIGH",
      context: "New user hasn't attended a session recently."
    };
  }

  if (stage === "ACTIVE" && engagementScore >= 80) {
    return {
      actionType: "UPSELL_MEMBERSHIP",
      priority: "LOW",
      context: "User is highly engaged. Good candidate for premium upgrades."
    };
  }

  return {
    actionType: "NONE",
    priority: "LOW",
    context: "No specific retention action required."
  };
}
