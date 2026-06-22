import { z } from "zod";
import { EntitlementKeys } from "./registry";

// Strictly typed schema for the JSON column in the database
export const EntitlementsSchema = z.object({
  version: z.number().int().default(1),
  [EntitlementKeys.MAX_CLASSES_PER_MONTH]: z.number().int().default(-1),
  [EntitlementKeys.MAX_TRAINER_SESSIONS]: z.number().int().default(0),
  [EntitlementKeys.AI_ACCESS]: z.boolean().default(false),
  [EntitlementKeys.MAX_AI_REQUESTS]: z.number().int().default(0),
  [EntitlementKeys.PRIORITY_BOOKING]: z.boolean().default(false),
  [EntitlementKeys.SAUNA_ACCESS]: z.boolean().default(false),
});

export type Entitlements = z.infer<typeof EntitlementsSchema>;

export const defaultEntitlements: Entitlements = EntitlementsSchema.parse({});
