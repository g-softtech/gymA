import { planCatalogService } from "../../lib/billing/StaticPlanCatalogService";

describe("PlanCatalogService", () => {
  it("returns all plans consistently", () => {
    const plans = planCatalogService.getPlans();
    expect(plans.length).toBeGreaterThan(0);
    
    // Check that we don't have deprecated plans
    const deprecated = plans.filter(p => p.isDeprecated);
    expect(deprecated.length).toBe(0);
  });

  it("resolves correct plan version", () => {
    const defaultPro = planCatalogService.getPlan("PRO");
    expect(defaultPro.code).toBe("PRO");

    const v1Pro = planCatalogService.getPlan("PRO", 1);
    expect(v1Pro.version).toBe(1);
    expect(v1Pro.code).toBe("PRO");
  });

  it("does not allow invalid plan codes", () => {
    expect(() => {
      // @ts-expect-error Testing invalid code
      planCatalogService.getPlan("INVALID_CODE");
    }).toThrow(/not found/i);
  });
});
