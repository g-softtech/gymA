import { TenantPlan } from "@prisma/client";
import { PLATFORM_PLANS, FeatureKey, PlatformPlanConfig } from "./billing/pricingConfig";

export class TenantCapabilities {
  private features: Set<FeatureKey>;
  private limits: PlatformPlanConfig["limits"];

  constructor(plan: TenantPlan, planVersion: string = "v1") {
    // In the future, planVersion can be used to load historical configs.
    // For now, we load from the active PLATFORM_PLANS.
    const planConfig = PLATFORM_PLANS[plan as keyof typeof PLATFORM_PLANS] || PLATFORM_PLANS.FREE;
    
    this.features = new Set(planConfig.capabilities);
    this.limits = planConfig.limits;
  }

  has(feature: FeatureKey): boolean {
    return this.features.has(feature);
  }

  getLimits() {
    return this.limits;
  }
}

// A simple in-memory cache for the duration of a request/session
// For more robust caching, this could integrate with Redis, but per-request caching is sufficient here.
const capabilitiesCache = new Map<string, TenantCapabilities>();

export function resolveCapabilities(tenantPlan: TenantPlan, planVersion: string = "v1"): TenantCapabilities {
  const cacheKey = `${tenantPlan}-${planVersion}`;
  
  if (capabilitiesCache.has(cacheKey)) {
    return capabilitiesCache.get(cacheKey)!;
  }

  const capabilities = new TenantCapabilities(tenantPlan, planVersion);
  capabilitiesCache.set(cacheKey, capabilities);
  
  return capabilities;
}
