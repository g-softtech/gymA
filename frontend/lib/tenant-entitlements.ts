import { TenantPlan } from "@prisma/client";

export interface TenantLimits {
  maxMembers: number;
  maxTrainers: number;
  hasAiCoach: boolean;
  hasCustomDomain: boolean;
  hasWebsiteBuilder: boolean;
  hasBlogModule: boolean;
  hasCustomBranding: boolean;
}

// FREE is not explicitly detailed by the user but we must map it for safety since TenantPlan enum includes FREE.
// We'll treat FREE like a stricter STARTER or just map it to STARTER limits.
export const TENANT_PLAN_LIMITS: Record<TenantPlan, TenantLimits> = {
  FREE: {
    maxMembers: 10,
    maxTrainers: 1,
    hasAiCoach: false,
    hasCustomDomain: false,
    hasWebsiteBuilder: false,
    hasBlogModule: false,
    hasCustomBranding: false,
  },
  STARTER: {
    maxMembers: 50,
    maxTrainers: 1,
    hasAiCoach: false,
    hasCustomDomain: false,
    hasWebsiteBuilder: true,
    hasBlogModule: true,
    hasCustomBranding: true,
  },
  GROWTH: {
    maxMembers: 150,
    maxTrainers: 5,
    hasAiCoach: true,
    hasCustomDomain: false,
    hasWebsiteBuilder: true,
    hasBlogModule: true,
    hasCustomBranding: true,
  },
  ENTERPRISE: {
    maxMembers: 999999, // Unlimited to handle our top network tiers smoothly
    maxTrainers: 999999, 
    hasAiCoach: true,
    hasCustomDomain: true,
    hasWebsiteBuilder: true,
    hasBlogModule: true,
    hasCustomBranding: true,
  }
};
