export type SubscriptionPlan = "FREE" | "PRO" | "ENTERPRISE" | string;

export function canUseCustomDomain(plan: SubscriptionPlan | null | undefined): boolean {
  if (!plan) return false;
  const upperPlan = plan.toUpperCase();
  return upperPlan === "PRO" || upperPlan === "ENTERPRISE";
}

export function canUseWhiteLabel(plan: SubscriptionPlan | null | undefined): boolean {
  if (!plan) return false;
  const upperPlan = plan.toUpperCase();
  return upperPlan === "ENTERPRISE";
}

export function getPlanLimit(plan: SubscriptionPlan | null | undefined, feature: "members" | "trainers"): number {
  const upperPlan = plan?.toUpperCase() || "FREE";
  
  if (upperPlan === "ENTERPRISE") {
    return Infinity;
  }
  
  if (upperPlan === "PRO") {
    return feature === "members" ? 500 : 10;
  }
  
  // FREE plan limits
  return feature === "members" ? 50 : 2;
}
