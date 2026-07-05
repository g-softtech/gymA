import { FeatureKey } from "./featureRegistry";

export type PlatformPlanCode = "STARTER" | "PRO" | "SCALE" | "APEX";

export interface PlanFeatureMetadata {
  quota?: number;
  rolloutPercentage?: number;
  [key: string]: unknown;
}

export interface PlanFeature {
  enabled: boolean;
  metadata?: PlanFeatureMetadata;
}

export interface TenantEntitlements {
  limits: {
    maxMembers: number | "UNLIMITED";
    maxTrainers: number | "UNLIMITED";
    maxLocations: number | "UNLIMITED";
  };
  features: Partial<Record<FeatureKey, PlanFeature>>;
}

export type CurrencyCode = "NGN" | "USD" | "KES";
export type BillingInterval = "month" | "year";

export interface PlanPrice {
  amountSubunits: number; 
  currency: CurrencyCode;
  interval: BillingInterval;
  isPromotional?: boolean;
}

export interface PlatformPlanConfig {
  code: PlatformPlanCode;
  version: number;
  recommendedUpgrades: PlatformPlanCode[];
  isDeprecated?: boolean;
  
  ui: {
    displayName: string;
    description: string;
    features: string[];
    notIncluded: string[];
    isMostPopular?: boolean;
  };

  pricing: PlanPrice[];
  entitlements: TenantEntitlements;
}

// Internal static configuration
export const STATIC_PLATFORM_PLANS: PlatformPlanConfig[] = [
  {
    code: "STARTER",
    version: 1,
    recommendedUpgrades: ["PRO", "SCALE"],
    ui: {
      displayName: "Starter Plan",
      description: "Perfect for small gyms just getting started",
      features: [
        "Up to 50 members",
        "1 trainer account",
        "Member management",
        "Paystack & Flutterwave billing logs",
        "Basic attendance tracking (QR Check-in)",
        "Member dashboard view",
        "Email support",
        "Custom branding settings",
        "No-code website builder",
        "Built-in facility blog module",
      ],
      notIncluded: [
        "AI Coach suites",
        "Community features",
        "Advanced revenue analytics",
        "Multiple locations",
      ],
    },
    pricing: [
      { amountSubunits: 10000000, currency: "NGN", interval: "year" },
    ],
    entitlements: {
      limits: { maxMembers: 50, maxTrainers: 1, maxLocations: 1 },
      features: {
        MEMBER_MANAGEMENT: { enabled: true },
        QR_CHECK_IN: { enabled: true },
        TRAINER_DEPLOYMENT: { enabled: true },
        REVENUE_LEDGERS: { enabled: true },
        GYM_BLOG: { enabled: true },
      },
    },
  },
  {
    code: "PRO",
    version: 1,
    recommendedUpgrades: ["SCALE", "APEX"],
    ui: {
      displayName: "Professional Plan",
      description: "For growing gyms that need more power",
      features: [
        "Up to 150 members",
        "5 trainer accounts",
        "Everything in Starter",
        "Gemini AI Fitness Coach",
        "AI Nutrition Planner (60+ Nigerian foods)",
        "Progress tracking & analytics",
        "Community boards & challenges",
        "Trainer booking system",
        "Basic revenue reports",
        "Priority support",
      ],
      notIncluded: ["Custom domain support", "Multiple locations"],
    },
    pricing: [
      { amountSubunits: 20000000, currency: "NGN", interval: "year" },
    ],
    entitlements: {
      limits: { maxMembers: 150, maxTrainers: 5, maxLocations: 1 },
      features: {
        MEMBER_MANAGEMENT: { enabled: true },
        QR_CHECK_IN: { enabled: true },
        TRAINER_DEPLOYMENT: { enabled: true },
        REVENUE_LEDGERS: { enabled: true },
        GYM_BLOG: { enabled: true },
        AI_COACH: { enabled: true },
        DYNAMIC_NUTRITION: { enabled: true },
        MILESTONE_LOGGERS: { enabled: true },
        COMMUNITY: { enabled: true },
        BOOKING_CALENDARS: { enabled: true },
      },
    },
  },
  {
    code: "SCALE",
    version: 1,
    recommendedUpgrades: ["APEX"],
    ui: {
      displayName: "Scale-Up Plan",
      description: "For elite gyms scaling their digital tracking",
      isMostPopular: true,
      features: [
        "Up to 400 members",
        "Unlimited trainers",
        "Everything in Professional",
        "Advanced financial intelligence & churn analytics",
        "Dedicated account support",
      ],
      notIncluded: ["Multiple locations / branch sync"],
    },
    pricing: [
      { amountSubunits: 30000000, currency: "NGN", interval: "year" },
    ],
    entitlements: {
      limits: { maxMembers: 400, maxTrainers: "UNLIMITED", maxLocations: 1 },
      features: {
        MEMBER_MANAGEMENT: { enabled: true },
        QR_CHECK_IN: { enabled: true },
        TRAINER_DEPLOYMENT: { enabled: true },
        REVENUE_LEDGERS: { enabled: true },
        GYM_BLOG: { enabled: true },
        AI_COACH: { enabled: true },
        DYNAMIC_NUTRITION: { enabled: true },
        MILESTONE_LOGGERS: { enabled: true },
        COMMUNITY: { enabled: true },
        BOOKING_CALENDARS: { enabled: true },
        ADVANCED_ANALYTICS: { enabled: true },
      },
    },
  },
  {
    code: "APEX",
    version: 1,
    recommendedUpgrades: [],
    ui: {
      displayName: "Apex Network Plan",
      description: "For gym chains and serious multi-location fitness businesses",
      features: [
        "Unlimited members",
        "Unlimited trainers",
        "Everything in Scale-Up",
        "Multiple gym locations (Branch sync across Wuse 2, Gwarinpa, etc.)",
        "Multi-tenant management overview",
        "Custom domain mapping support (yourgym.com)",
        "API access",
        "99.9% Uptime SLA guarantee",
        "Phone & WhatsApp support",
      ],
      notIncluded: [],
    },
    pricing: [
      { amountSubunits: 40000000, currency: "NGN", interval: "year" },
    ],
    entitlements: {
      limits: { maxMembers: "UNLIMITED", maxTrainers: "UNLIMITED", maxLocations: "UNLIMITED" },
      features: {
        MEMBER_MANAGEMENT: { enabled: true },
        QR_CHECK_IN: { enabled: true },
        TRAINER_DEPLOYMENT: { enabled: true },
        REVENUE_LEDGERS: { enabled: true },
        GYM_BLOG: { enabled: true },
        AI_COACH: { enabled: true },
        DYNAMIC_NUTRITION: { enabled: true },
        MILESTONE_LOGGERS: { enabled: true },
        COMMUNITY: { enabled: true },
        BOOKING_CALENDARS: { enabled: true },
        ADVANCED_ANALYTICS: { enabled: true },
        MULTI_LOCATION: { enabled: true },
        CUSTOM_DOMAIN: { enabled: true },
        API_ACCESS: { enabled: true },
      },
    },
  },
];
