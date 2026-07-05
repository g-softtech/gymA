import { planCatalogService } from "../../lib/billing/StaticPlanCatalogService";
import { resolveEffectiveEntitlements } from "../../lib/entitlements/resolveEffectiveEntitlements";
import { subscriptionEventBus } from "../../lib/events/subscriptionEventBus";
import { getProviderMapping } from "../../lib/billing/providerMapping";
import { TenantEntitlements } from "../../lib/billing/pricing.config";

describe("End-to-End Billing Flow", () => {
  it("subscription -> entitlement -> feature access works end to end", async () => {
    const tenantId = "tenant_e2e_1";

    // 1. User selects "PRO" plan from UI (which pulled from planCatalogService)
    const selectedPlan = planCatalogService.getPlan("PRO");
    expect(selectedPlan.code).toBe("PRO");

    // 2. We resolve the provider mapping to charge them via Paystack
    const mapping = getProviderMapping(selectedPlan.code, selectedPlan.version, "year");
    expect(mapping?.paystackPlanCode).toBe("PLN_pro_yr_v1");

    // 3. User pays successfully, we create the subscription and emit event
    await subscriptionEventBus.emit("subscription_created", {
      tenantId,
      newPlanCode: selectedPlan.code,
      newPlanVersion: selectedPlan.version,
      actor: "system"
    });

    // 4. We calculate effective entitlements for the new PRO subscription
    // Suppose they bought an add-on for 10 extra trainers
    const effectiveEntitlements = resolveEffectiveEntitlements(
      selectedPlan.entitlements, 
      [{ limits: { maxTrainers: 10 } }]
    );

    // PRO base trainer limit is 5. With 10 extra, it should be 15.
    expect(effectiveEntitlements.limits.maxTrainers).toBe(15);
    
    // PRO plan has AI_COACH
    expect(effectiveEntitlements.features.AI_COACH?.enabled).toBe(true);
    
    // PRO plan does NOT have MULTI_LOCATION
    expect(effectiveEntitlements.features.MULTI_LOCATION?.enabled).toBeFalsy();
  });
});
