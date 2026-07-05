import { TenantEntitlements } from "../billing/pricing.config";
import { FeatureKey } from "../billing/featureRegistry";
import { resolveEffectiveEntitlements, AddOnEntitlements, TenantOverrides } from "./resolveEffectiveEntitlements";
import { planCatalogService } from "../billing/StaticPlanCatalogService";

// In a real application, you would load these from your database based on the tenantId
interface TenantSubscriptionState {
  planCode: string;
  planVersion: number;
  addOns: AddOnEntitlements[];
  overrides?: TenantOverrides;
}

export class TenantCapabilityService {
  // Simple in-memory cache for the duration of a request/context
  private requestCache: Map<string, TenantEntitlements> = new Map();

  /**
   * Resolves and caches the effective entitlements for a tenant.
   * In a real app, you'd fetch the tenant's subscription state from the database.
   */
  async getEffectiveEntitlements(tenantId: string): Promise<TenantEntitlements> {
    if (this.requestCache.has(tenantId)) {
      return this.requestCache.get(tenantId)!;
    }

    // MOCK: Fetch subscription state from database
    // const state = await db.subscriptions.findByTenantId(tenantId);
    const state: TenantSubscriptionState = {
      planCode: "STARTER", // Mocked as STARTER for now
      planVersion: 1,
      addOns: [],
    };

    const basePlan = planCatalogService.getPlan(state.planCode as any, state.planVersion);
    const effective = resolveEffectiveEntitlements(basePlan.entitlements, state.addOns, state.overrides);
    
    this.requestCache.set(tenantId, effective);
    return effective;
  }

  /**
   * Asserts that a tenant has a specific feature enabled. Throws if not.
   */
  async assertFeature(tenantId: string, featureKey: FeatureKey): Promise<void> {
    const hasFeature = await this.hasFeature(tenantId, featureKey);
    if (!hasFeature) {
      throw new Error(`Tenant ${tenantId} is not entitled to feature: ${featureKey}`);
    }
  }

  /**
   * Asserts that a tenant is within a specific limit. Throws if exceeded.
   */
  async assertLimit(
    tenantId: string, 
    limitKey: keyof TenantEntitlements["limits"], 
    requestedAmount: number
  ): Promise<void> {
    const isWithinLimit = await this.isWithinLimit(tenantId, limitKey, requestedAmount);
    if (!isWithinLimit) {
      const effective = await this.getEffectiveEntitlements(tenantId);
      const limit = effective.limits[limitKey];
      throw new Error(`Tenant ${tenantId} exceeded limit ${limitKey}. Allowed: ${limit}, Requested: ${requestedAmount}`);
    }
  }

  /**
   * Queries if a tenant has a specific feature enabled.
   */
  async hasFeature(tenantId: string, featureKey: FeatureKey): Promise<boolean> {
    const effective = await this.getEffectiveEntitlements(tenantId);
    const feature = effective.features[featureKey];
    return feature?.enabled === true;
  }

  /**
   * Queries if a requested amount is within the tenant's limit.
   */
  async isWithinLimit(
    tenantId: string, 
    limitKey: keyof TenantEntitlements["limits"], 
    requestedAmount: number
  ): Promise<boolean> {
    const effective = await this.getEffectiveEntitlements(tenantId);
    const limit = effective.limits[limitKey];
    
    if (limit === "UNLIMITED") {
      return true;
    }
    return requestedAmount <= limit;
  }

  /**
   * Clears the request cache (useful for middleware/context cleanup)
   */
  clearCache(tenantId?: string) {
    if (tenantId) {
      this.requestCache.delete(tenantId);
    } else {
      this.requestCache.clear();
    }
  }
}

// Export singleton
export const tenantCapabilityService = new TenantCapabilityService();
