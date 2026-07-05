import { PlanCatalogService } from "./PlanCatalogService";
import { PlatformPlanConfig, PlatformPlanCode, STATIC_PLATFORM_PLANS } from "./pricing.config";

export class StaticPlanCatalogService implements PlanCatalogService {
  private cache: PlatformPlanConfig[] = [];

  constructor() {
    // In-memory read-through cache initialized on startup
    this.cache = [...STATIC_PLATFORM_PLANS];
  }

  getPlans(): PlatformPlanConfig[] {
    return this.cache.filter((plan) => !plan.isDeprecated);
  }

  getPlan(code: PlatformPlanCode, version?: number): PlatformPlanConfig {
    // If version is provided, find exact match.
    // If no version, find the highest version (latest active) for that code.
    const plansByCode = this.cache.filter((p) => p.code === code);
    
    if (plansByCode.length === 0) {
      throw new Error(`Plan with code ${code} not found in catalog.`);
    }

    if (version !== undefined) {
      const specificPlan = plansByCode.find((p) => p.version === version);
      if (!specificPlan) {
        throw new Error(`Plan ${code} at version ${version} not found in catalog.`);
      }
      return specificPlan;
    }

    // Default to the latest version
    return plansByCode.reduce((latest, current) => 
      current.version > latest.version ? current : latest
    , plansByCode[0]);
  }
}

// Export a singleton instance for use across the application
export const planCatalogService = new StaticPlanCatalogService();
