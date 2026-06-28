export type PlatformPlanCode = "FREE" | "PRO" | "ENTERPRISE";

export interface PlatformPlanConfig {
  code: PlatformPlanCode;
  name: string;
  amountNGN: number;
  description: string;
  features: string[];
  interval: "month" | "year";
  isTrial: boolean;
  maxMembers: number; // -1 for unlimited
}

// Global configuration for billing policies
export const RENEWAL_WINDOW_DAYS = 5;
export const EXPIRY_WARNING_DAYS = 3;
export const GRACE_PERIOD_DAYS = 7;
export const TRIAL_DURATION_DAYS = 14;

export const PLATFORM_PLANS: Record<PlatformPlanCode, PlatformPlanConfig> = {
  FREE: {
    code: "FREE",
    name: "Starter",
    amountNGN: 0,
    description: "Basic gym management for small gyms",
    features: ["Up to 50 members", "1 trainer account", "Member management", "Basic attendance tracking"],
    interval: "month",
    isTrial: true,
    maxMembers: 50,
  },
  PRO: {
    code: "PRO",
    name: "Professional",
    amountNGN: 49000, // ₦49,000
    description: "For growing gyms that need more power",
    features: ["Custom Domain", "Up to 500 members", "AI Fitness Coach", "Advanced analytics"],
    interval: "month",
    isTrial: false,
    maxMembers: 500,
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    name: "Enterprise",
    amountNGN: 199000, // ₦199,000
    description: "Full white-label SaaS experience",
    features: ["White-Label Mode", "Unlimited members", "Multiple gym locations", "API access"],
    interval: "month",
    isTrial: false,
    maxMembers: -1,
  },
};
