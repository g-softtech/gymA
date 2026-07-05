import { TenantEntitlements, PlanFeature } from "../billing/pricing.config";
import { FeatureKey } from "../billing/featureRegistry";

export interface AddOnEntitlements {
  limits?: {
    maxMembers?: number;
    maxTrainers?: number;
    maxLocations?: number;
  };
  features?: Partial<Record<FeatureKey, PlanFeature>>;
}

export interface TenantOverrides {
  limits?: {
    maxMembers?: number | "UNLIMITED";
    maxTrainers?: number | "UNLIMITED";
    maxLocations?: number | "UNLIMITED";
  };
  features?: Partial<Record<FeatureKey, PlanFeature>>;
}

function resolveLimit(
  base: number | "UNLIMITED",
  addOn?: number,
  override?: number | "UNLIMITED"
): number | "UNLIMITED" {
  if (override !== undefined) {
    return override;
  }
  if (base === "UNLIMITED") {
    return "UNLIMITED";
  }
  return base + (addOn || 0);
}

export function resolveEffectiveEntitlements(
  baseEntitlements: TenantEntitlements,
  addOns: AddOnEntitlements[] = [],
  overrides?: TenantOverrides
): TenantEntitlements {
  // 1. Combine Add-Ons
  const combinedAddOnLimits = addOns.reduce(
    (acc, addOn) => ({
      maxMembers: acc.maxMembers + (addOn.limits?.maxMembers || 0),
      maxTrainers: acc.maxTrainers + (addOn.limits?.maxTrainers || 0),
      maxLocations: acc.maxLocations + (addOn.limits?.maxLocations || 0),
    }),
    { maxMembers: 0, maxTrainers: 0, maxLocations: 0 }
  );

  const combinedAddOnFeatures: Partial<Record<FeatureKey, PlanFeature>> = {};
  for (const addOn of addOns) {
    if (addOn.features) {
      for (const [key, feature] of Object.entries(addOn.features)) {
        const featureKey = key as FeatureKey;
        // Add-ons can only ENABLE features, not disable them.
        if (feature?.enabled) {
          combinedAddOnFeatures[featureKey] = {
            enabled: true,
            metadata: { ...combinedAddOnFeatures[featureKey]?.metadata, ...feature.metadata },
          };
        }
      }
    }
  }

  // 2. Resolve Limits
  const resolvedLimits = {
    maxMembers: resolveLimit(
      baseEntitlements.limits.maxMembers,
      combinedAddOnLimits.maxMembers,
      overrides?.limits?.maxMembers
    ),
    maxTrainers: resolveLimit(
      baseEntitlements.limits.maxTrainers,
      combinedAddOnLimits.maxTrainers,
      overrides?.limits?.maxTrainers
    ),
    maxLocations: resolveLimit(
      baseEntitlements.limits.maxLocations,
      combinedAddOnLimits.maxLocations,
      overrides?.limits?.maxLocations
    ),
  };

  // 3. Resolve Features
  const resolvedFeatures: Partial<Record<FeatureKey, PlanFeature>> = { ...baseEntitlements.features };

  // Apply Add-ons (only enabling)
  for (const [key, feature] of Object.entries(combinedAddOnFeatures)) {
    const featureKey = key as FeatureKey;
    if (feature?.enabled) {
      resolvedFeatures[featureKey] = {
        enabled: true,
        metadata: { ...resolvedFeatures[featureKey]?.metadata, ...feature.metadata },
      };
    }
  }

  // Apply Overrides (can enable or disable)
  if (overrides?.features) {
    for (const [key, feature] of Object.entries(overrides.features)) {
      const featureKey = key as FeatureKey;
      if (feature) {
        resolvedFeatures[featureKey] = { ...feature };
      }
    }
  }

  return {
    limits: resolvedLimits,
    features: resolvedFeatures,
  };
}
