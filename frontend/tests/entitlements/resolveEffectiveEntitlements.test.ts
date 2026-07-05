import { resolveEffectiveEntitlements, AddOnEntitlements } from "../../lib/entitlements/resolveEffectiveEntitlements";
import { TenantEntitlements } from "../../lib/billing/pricing.config";

describe("Entitlement Merging", () => {
  const basePlan: TenantEntitlements = {
    limits: {
      maxMembers: 50,
      maxTrainers: 1,
      maxLocations: 1
    },
    features: {
      MEMBER_MANAGEMENT: { enabled: true }
    }
  };

  it("adds capacity from multiple add-ons", () => {
    const addOn1: AddOnEntitlements = { limits: { maxMembers: 100 } };
    const addOn2: AddOnEntitlements = { limits: { maxTrainers: 5 } };
    
    const effective = resolveEffectiveEntitlements(basePlan, [addOn1, addOn2]);
    
    expect(effective.limits.maxMembers).toBe(150);
    expect(effective.limits.maxTrainers).toBe(6);
  });

  it("does not allow feature downgrade via add-ons", () => {
    // Add-ons can only ENABLE features, not disable them.
    const badAddOn: AddOnEntitlements = {
      features: {
        MEMBER_MANAGEMENT: { enabled: false }
      }
    };
    
    const effective = resolveEffectiveEntitlements(basePlan, [badAddOn]);
    
    // Feature should still be enabled from base plan
    expect(effective.features.MEMBER_MANAGEMENT?.enabled).toBe(true);
  });

  it("applies overrides correctly", () => {
    const effective = resolveEffectiveEntitlements(basePlan, [], {
      limits: { maxMembers: "UNLIMITED" },
      features: { MEMBER_MANAGEMENT: { enabled: false } }
    });
    
    // Override CAN disable features and set to unlimited
    expect(effective.limits.maxMembers).toBe("UNLIMITED");
    expect(effective.features.MEMBER_MANAGEMENT?.enabled).toBe(false);
  });
});
