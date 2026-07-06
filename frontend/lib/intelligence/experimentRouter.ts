import crypto from "crypto";
import { ExperimentVariant } from "@prisma/client";

/**
 * Creates a deterministic, stable 32-bit hash from an input string using SHA-256.
 * Using Node's native crypto module avoids dependencies and ensures 
 * cryptographic stability across all environments.
 */
export function stableHash(input: string): number {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  // Take first 8 chars → 32-bit space
  return parseInt(hash.substring(0, 8), 16);
}

export type TrafficSplit = {
  variant: ExperimentVariant;
  weight: number; // e.g., 0.7 for 70%
}[];

/**
 * Assigns a variant deterministically based on weighted partitioning.
 * Avoids rounding drift and supports arbitrary N variants.
 */
export function assignVariant(
  userId: string,
  experimentId: string,
  trafficSplit: TrafficSplit
): ExperimentVariant {
  const hash = stableHash(userId + experimentId);
  const normalized = hash % 1000;

  let cumulative = 0;

  for (const split of trafficSplit) {
    cumulative += split.weight * 1000;
    if (normalized < cumulative) {
      return split.variant;
    }
  }

  // Fallback to the first variant if weights didn't sum to exactly 1.0
  // or due to precision issues (though we assume the split is validated).
  return trafficSplit[0].variant;
}
