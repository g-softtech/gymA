import { PlatformPlanCode, BillingInterval } from "./pricing.config";

export interface ProviderMapping {
  planCode: PlatformPlanCode;
  version: number;
  interval: BillingInterval;
  stripePriceId?: string;
  paystackPlanCode?: string;
  flutterwavePlanId?: string;
}

export const PROVIDER_MAPPINGS: ProviderMapping[] = [
  {
    planCode: "STARTER",
    version: 1,
    interval: "year",
    paystackPlanCode: "PLN_starter_yr_v1",
  },
  {
    planCode: "PRO",
    version: 1,
    interval: "year",
    paystackPlanCode: "PLN_pro_yr_v1",
  },
  {
    planCode: "SCALE",
    version: 1,
    interval: "year",
    paystackPlanCode: "PLN_scale_yr_v1",
  },
  {
    planCode: "APEX",
    version: 1,
    interval: "year",
    paystackPlanCode: "PLN_apex_yr_v1",
  },
];

export function getProviderMapping(
  code: PlatformPlanCode,
  version: number,
  interval: BillingInterval
): ProviderMapping | undefined {
  return PROVIDER_MAPPINGS.find(
    (m) => m.planCode === code && m.version === version && m.interval === interval
  );
}
