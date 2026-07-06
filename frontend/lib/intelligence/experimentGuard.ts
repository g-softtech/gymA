import { ExperimentVariant } from "@prisma/client";
import { TrafficSplit } from "./experimentRouter";

export class ExperimentSafetyGuard {
  static readonly MIN_CONTROL_PERCENTAGE = 0.5; // 50%
  static readonly MIN_SAMPLE_THRESHOLD = 500;

  /**
   * Validates that an experiment's traffic split conforms to safety constraints.
   * Hard constraint: Control group MUST be ≥ 50%.
   */
  static validateTrafficSplit(split: TrafficSplit): { valid: boolean; reason?: string } {
    let totalWeight = 0;
    let controlWeight = 0;

    for (const s of split) {
      totalWeight += s.weight;
      if (s.variant === ExperimentVariant.CONTROL) {
        controlWeight += s.weight;
      }
    }

    if (Math.abs(totalWeight - 1.0) > 0.001) {
      return { valid: false, reason: "Traffic split weights must sum to exactly 1.0" };
    }

    if (controlWeight < this.MIN_CONTROL_PERCENTAGE) {
      return { 
        valid: false, 
        reason: `Control group must be at least ${this.MIN_CONTROL_PERCENTAGE * 100}%. Provided: ${controlWeight * 100}%` 
      };
    }

    return { valid: true };
  }

  /**
   * Checks if an experiment variant has accumulated enough samples 
   * to be considered for evaluation or promotion.
   */
  static hasMinimumSamples(samples: number): boolean {
    return samples >= this.MIN_SAMPLE_THRESHOLD;
  }
}
