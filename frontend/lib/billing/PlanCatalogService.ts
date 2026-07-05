import { PlatformPlanConfig, PlatformPlanCode } from "./pricing.config";

export interface PlanCatalogService {
  /**
   * Returns all available plans in the catalog.
   */
  getPlans(): PlatformPlanConfig[];

  /**
   * Returns a specific plan by its code and optional version.
   * If version is not provided, it should return the latest active version.
   */
  getPlan(code: PlatformPlanCode, version?: number): PlatformPlanConfig;
}
