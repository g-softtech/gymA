import { PLATFORM_PLANS, PlatformPlanConfig, PlatformPlanCode } from "./pricingConfig";

export class StaticPlanCatalogService {
  private cache: PlatformPlanConfig[] = [];

  constructor() {
    this.cache = Object.values(PLATFORM_PLANS);
  }

  getPlans(): PlatformPlanConfig[] {
    return this.cache;
  }

  getPlan(code: PlatformPlanCode): PlatformPlanConfig {
    const plan = this.cache.find((p) => p.code === code);
    if (!plan) throw new Error(`Plan with code ${code} not found in catalog.`);
    return plan;
  }
}

export const planCatalogService = new StaticPlanCatalogService();
