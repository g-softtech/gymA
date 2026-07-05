import { getProviderMapping } from "../../lib/billing/providerMapping";

describe("Provider Mapping", () => {
  it("maps plan + version correctly", () => {
    const mapping = getProviderMapping("STARTER", 1, "year");
    expect(mapping).toBeDefined();
    expect(mapping?.paystackPlanCode).toBe("PLN_starter_yr_v1");
  });

  it("fails gracefully on missing mapping", () => {
    const mapping = getProviderMapping("APEX", 99, "month");
    expect(mapping).toBeUndefined();
  });
});
