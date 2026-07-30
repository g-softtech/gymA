export type PlatformPlanCode = "FREE" | "STARTER" | "PROFESSIONAL" | "SCALEUP" | "APEX";

export type FeatureKey =
  | "AI_ASSISTANT"
  | "MEMBER_LIMIT"
  | "TRAINER_LIMIT"
  | "MULTI_BRANCH"
  | "CUSTOM_DOMAIN"
  | "WHITE_LABEL"
  | "WEBSITE"
  | "ONLINE_BOOKING"
  | "CLASS_BOOKING"
  | "NUTRITION"
  | "PAYROLL"
  | "ANALYTICS"
  | "REPORTS"
  | "PUBLIC_API"
  | "FILE_STORAGE"
  | "STAFF_ROLES"
  | "ATTENDANCE"
  | "SMS"
  | "EMAIL"
  | "QR_CHECKIN"
  | "MOBILE_APP";

export interface PlatformPlanConfig {
  code: PlatformPlanCode;
  displayName: string;
  yearlyPrice: number;
  marketingDescription: string;
  isTrial: boolean;
  recommended?: boolean;
  limits: {
    maxMembers: number; // -1 for unlimited
    maxTrainers: number; // -1 for unlimited
    maxBranches: number;
  };
  capabilities: FeatureKey[];
  comparisonFeatures: {
    name: string;
    included: boolean;
    text?: string; // e.g. "Up to 50", "Unlimited"
  }[];
}

// Global configuration for billing policies
export const RENEWAL_WINDOW_DAYS = 5;
export const EXPIRY_WARNING_DAYS = 3;
export const GRACE_PERIOD_DAYS = 7;
export const TRIAL_DURATION_DAYS = 14;

export const PLATFORM_PLANS: Record<PlatformPlanCode, PlatformPlanConfig> = {
  FREE: {
    code: "FREE",
    displayName: "Free Trial",
    yearlyPrice: 0,
    marketingDescription: "14-day free trial of Professional features",
    isTrial: true,
    limits: {
      maxMembers: 50,
      maxTrainers: 1,
      maxBranches: 1,
    },
    capabilities: [
      "MEMBER_LIMIT", "TRAINER_LIMIT", "ATTENDANCE", "REPORTS"
    ],
    comparisonFeatures: []
  },
  STARTER: {
    code: "STARTER",
    displayName: "Starter Plan",
    yearlyPrice: 100000,
    marketingDescription: "Perfect for small, independent gyms just getting started with digital management.",
    isTrial: false,
    limits: {
      maxMembers: 100,
      maxTrainers: 2,
      maxBranches: 1,
    },
    capabilities: [
      "MEMBER_LIMIT", "TRAINER_LIMIT", "ATTENDANCE", "REPORTS", "EMAIL", "ONLINE_BOOKING", "CLASS_BOOKING"
    ],
    comparisonFeatures: [
      { name: "Members", included: true, text: "Up to 100" },
      { name: "Trainers", included: true, text: "Up to 2" },
      { name: "Locations", included: true, text: "1 Branch" },
      { name: "Basic Analytics", included: true },
      { name: "AI Coach", included: false },
      { name: "Custom Domain", included: false },
      { name: "White Label", included: false },
    ]
  },
  PROFESSIONAL: {
    code: "PROFESSIONAL",
    displayName: "Professional Plan",
    yearlyPrice: 200000,
    marketingDescription: "Designed for growing gyms that need more power. Includes our signature AI Coach.",
    isTrial: false,
    recommended: true,
    limits: {
      maxMembers: 500,
      maxTrainers: 10,
      maxBranches: 1,
    },
    capabilities: [
      "MEMBER_LIMIT", "TRAINER_LIMIT", "ATTENDANCE", "REPORTS", "EMAIL", "ONLINE_BOOKING", "CLASS_BOOKING",
      "AI_ASSISTANT", "WEBSITE", "SMS", "QR_CHECKIN", "NUTRITION", "ANALYTICS"
    ],
    comparisonFeatures: [
      { name: "Members", included: true, text: "Up to 500" },
      { name: "Trainers", included: true, text: "Up to 10" },
      { name: "Locations", included: true, text: "1 Branch" },
      { name: "Advanced Analytics", included: true },
      { name: "AI Coach", included: true },
      { name: "Website Builder", included: true },
      { name: "Custom Domain", included: false },
      { name: "White Label", included: false },
    ]
  },
  SCALEUP: {
    code: "SCALEUP",
    displayName: "Scale-Up Plan",
    yearlyPrice: 300000,
    marketingDescription: "For elite gyms rapidly scaling their operations. Includes advanced revenue insights.",
    isTrial: false,
    limits: {
      maxMembers: 2000,
      maxTrainers: 30,
      maxBranches: 3,
    },
    capabilities: [
      "MEMBER_LIMIT", "TRAINER_LIMIT", "ATTENDANCE", "REPORTS", "EMAIL", "ONLINE_BOOKING", "CLASS_BOOKING",
      "AI_ASSISTANT", "WEBSITE", "SMS", "QR_CHECKIN", "NUTRITION", "ANALYTICS", "PAYROLL", "CUSTOM_DOMAIN"
    ],
    comparisonFeatures: [
      { name: "Members", included: true, text: "Up to 2,000" },
      { name: "Trainers", included: true, text: "Up to 30" },
      { name: "Locations", included: true, text: "Up to 3 Branches" },
      { name: "Advanced Analytics", included: true },
      { name: "AI Coach", included: true },
      { name: "Website Builder", included: true },
      { name: "Custom Domain", included: true },
      { name: "White Label", included: false },
    ]
  },
  APEX: {
    code: "APEX",
    displayName: "Apex Network Plan",
    yearlyPrice: 400000,
    marketingDescription: "The ultimate enterprise solution for gym franchises and multi-location businesses.",
    isTrial: false,
    limits: {
      maxMembers: -1,
      maxTrainers: -1,
      maxBranches: -1,
    },
    capabilities: [
      "MEMBER_LIMIT", "TRAINER_LIMIT", "ATTENDANCE", "REPORTS", "EMAIL", "ONLINE_BOOKING", "CLASS_BOOKING",
      "AI_ASSISTANT", "WEBSITE", "SMS", "QR_CHECKIN", "NUTRITION", "ANALYTICS", "PAYROLL", "CUSTOM_DOMAIN",
      "MULTI_BRANCH", "WHITE_LABEL", "PUBLIC_API", "FILE_STORAGE", "STAFF_ROLES", "MOBILE_APP"
    ],
    comparisonFeatures: [
      { name: "Members", included: true, text: "Unlimited" },
      { name: "Trainers", included: true, text: "Unlimited" },
      { name: "Locations", included: true, text: "Unlimited Branches" },
      { name: "Advanced Analytics", included: true },
      { name: "AI Coach", included: true },
      { name: "Website Builder", included: true },
      { name: "Custom Domain", included: true },
      { name: "White Label", included: true },
    ]
  },
};

