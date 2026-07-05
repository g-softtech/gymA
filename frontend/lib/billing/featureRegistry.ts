export type FeatureKey =
  | "AI_COACH"
  | "CUSTOM_DOMAIN"
  | "API_ACCESS"
  | "COMMUNITY"
  | "ADVANCED_ANALYTICS"
  | "MULTI_LOCATION"
  | "WHITE_LABEL"
  | "MEMBER_MANAGEMENT"
  | "QR_CHECK_IN"
  | "TRAINER_DEPLOYMENT"
  | "REVENUE_LEDGERS"
  | "BOOKING_CALENDARS"
  | "GYM_BLOG"
  | "MILESTONE_LOGGERS"
  | "DYNAMIC_NUTRITION";

export type FeatureStatus = "GA" | "Beta" | "Experimental";

export interface FeatureDefinition {
  key: FeatureKey;
  displayName: string;
  category: string;
  description: string;
  status: FeatureStatus;
}

export const FEATURE_REGISTRY: Record<FeatureKey, FeatureDefinition> = {
  AI_COACH: {
    key: "AI_COACH",
    displayName: "Interactive AI Fitness Coach",
    category: "AI",
    description: "24/7 personalized Gemini workouts and insights.",
    status: "GA",
  },
  CUSTOM_DOMAIN: {
    key: "CUSTOM_DOMAIN",
    displayName: "Custom Domain Support",
    category: "Branding",
    description: "Map your own domain (e.g., yourgym.com).",
    status: "GA",
  },
  API_ACCESS: {
    key: "API_ACCESS",
    displayName: "Developer API Access",
    category: "Integrations",
    description: "Access the CortexFit API for custom integrations.",
    status: "Beta",
  },
  COMMUNITY: {
    key: "COMMUNITY",
    displayName: "Community Boards & Challenges",
    category: "Engagement",
    description: "In-app community boards and fitness challenges for members.",
    status: "GA",
  },
  ADVANCED_ANALYTICS: {
    key: "ADVANCED_ANALYTICS",
    displayName: "Advanced Financial & Churn Analytics",
    category: "Reporting",
    description: "Deep insights into financial health, member retention, and churn prediction.",
    status: "GA",
  },
  MULTI_LOCATION: {
    key: "MULTI_LOCATION",
    displayName: "Multiple Gym Locations",
    category: "Operations",
    description: "Branch sync across multiple physical gym locations.",
    status: "GA",
  },
  WHITE_LABEL: {
    key: "WHITE_LABEL",
    displayName: "Full White-Label Mode",
    category: "Branding",
    description: "Remove all CortexFit branding for a fully custom SaaS experience.",
    status: "Beta",
  },
  MEMBER_MANAGEMENT: {
    key: "MEMBER_MANAGEMENT",
    displayName: "Member Management",
    category: "Operations",
    description: "Core member tracking, onboarding, and profile management.",
    status: "GA",
  },
  QR_CHECK_IN: {
    key: "QR_CHECK_IN",
    displayName: "QR Code Attendance",
    category: "Operations",
    description: "Frictionless QR code attendance generation and scanning.",
    status: "GA",
  },
  TRAINER_DEPLOYMENT: {
    key: "TRAINER_DEPLOYMENT",
    displayName: "Trainer Deployment Portal",
    category: "Staff",
    description: "Assign and manage trainers, schedules, and clients.",
    status: "GA",
  },
  REVENUE_LEDGERS: {
    key: "REVENUE_LEDGERS",
    displayName: "Integrated Revenue Ledgers",
    category: "Reporting",
    description: "Consolidated multi-gateway (Paystack/Flutterwave) billing management.",
    status: "GA",
  },
  BOOKING_CALENDARS: {
    key: "BOOKING_CALENDARS",
    displayName: "Class & Trainer Booking",
    category: "Operations",
    description: "Seamlessly reserve slots with favorite instructors and classes.",
    status: "GA",
  },
  GYM_BLOG: {
    key: "GYM_BLOG",
    displayName: "Built-in Gym Blog",
    category: "Engagement",
    description: "Publish news, updates, and articles directly to members.",
    status: "GA",
  },
  MILESTONE_LOGGERS: {
    key: "MILESTONE_LOGGERS",
    displayName: "Milestone Progress Loggers",
    category: "Engagement",
    description: "Track weight, body fat, and strength gains.",
    status: "GA",
  },
  DYNAMIC_NUTRITION: {
    key: "DYNAMIC_NUTRITION",
    displayName: "Dynamic Nutrition Tracking",
    category: "AI",
    description: "Log calories and macros with regional African foods.",
    status: "GA",
  },
};
