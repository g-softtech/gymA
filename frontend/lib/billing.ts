import { TenantPlan } from "@prisma/client";

export interface SaaSPlanDetails {
  name: string;
  price: number;
  maxMembers: number;
  maxTrainers: number;
  maxAiRequests: number;
  features: string[];
}

export const SAAS_PLANS: Record<TenantPlan, SaaSPlanDetails> = {
  FREE: {
    name: "Free Trial",
    price: 0,
    maxMembers: 1000000, // Conceptually unlimited
    maxTrainers: 1000000,
    maxAiRequests: 200, // Trial limit is 200 total
    features: [
      "14 days full access",
      "Unlimited members & trainers",
      "Full AI Suite",
      "Custom domains",
    ],
  },
  STARTER: {
    name: "Starter",
    price: 15000,
    maxMembers: 100,
    maxTrainers: 1,
    maxAiRequests: 0,
    features: [
      "Up to 100 members",
      "1 trainer account",
      "Standard website builder",
      "No AI features",
      "No custom domain",
    ],
  },
  GROWTH: {
    name: "Growth",
    price: 35000,
    maxMembers: 500,
    maxTrainers: 5,
    maxAiRequests: 300,
    features: [
      "Up to 500 members",
      "Up to 5 trainer accounts",
      "300 AI requests/month",
      "AI Fitness & Nutrition",
      "Standard website builder",
      "No custom domain",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 80000,
    maxMembers: 1000000,
    maxTrainers: 1000000,
    maxAiRequests: 1000000,
    features: [
      "Unlimited members",
      "Unlimited trainers",
      "Unlimited AI requests",
      "Full AI Suite + Chat",
      "Advanced website builder",
      "Custom domains",
      "Multi-branch support",
    ],
  },
};

export function getTenantLimits(plan: TenantPlan): SaaSPlanDetails {
  return SAAS_PLANS[plan];
}
