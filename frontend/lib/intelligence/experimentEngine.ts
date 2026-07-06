import { ExperimentLayer, ExperimentVariant, IntelligenceExperiment } from "@prisma/client";
import { assignVariant, TrafficSplit } from "./experimentRouter";
import { ExperimentSafetyGuard } from "./experimentGuard";

// Types simulating the Phase 8 scoring and execution logic
type ScoringInput = any;
type ScoringResult = { score: number; confidence: number };
type PolicyDecision = { actionType: string; explorationPolicy: string; [key: string]: any };

/**
 * The single scoring contract. Scoring logic is NEVER modified by the variant.
 */
function enforceSingleScoringContract(input: ScoringInput): ScoringResult {
  // Example dummy scoring logic (in a real system this would call the actual ML model / heuristical logic)
  return { score: 0.85, confidence: 0.9 };
}

/**
 * Variant-specific policy logic.
 * This is where the variant is allowed to change decision behavior based on the uniform score.
 */
function applyVariantPolicy(variant: ExperimentVariant, score: ScoringResult): PolicyDecision {
  switch (variant) {
    case ExperimentVariant.CONTROL:
      return { actionType: "DISCOUNT_5", explorationPolicy: "DETERMINISTIC_RANKING" };
    case ExperimentVariant.BAYESIAN:
      return { actionType: "DISCOUNT_10", explorationPolicy: "BAYESIAN_UCB" };
    case ExperimentVariant.UCB:
      return { actionType: "DISCOUNT_5", explorationPolicy: "UCB1" };
    case ExperimentVariant.THOMPSON:
      return { actionType: "FREE_PT_SESSION", explorationPolicy: "THOMPSON_SAMPLING" };
    case ExperimentVariant.WEIGHTED_SAMPLING:
      return { actionType: "DISCOUNT_5", explorationPolicy: "WEIGHTED_SAMPLING" };
    case ExperimentVariant.TOP_K:
      return { actionType: "DISCOUNT_5", explorationPolicy: "TOP_K" };
    case ExperimentVariant.EPSILON_GREEDY:
      return { actionType: "DISCOUNT_10", explorationPolicy: "EPSILON_GREEDY" };
    default:
      // Safety fallback
      return { actionType: "DISCOUNT_5", explorationPolicy: "DETERMINISTIC_RANKING" };
  }
}

/**
 * The Experiment Engine handles evaluating inputs through the unified ML control plane.
 * It strictly separates SCORING experiments (if any) from POLICY experiments, though 
 * typically the Single Scoring Contract demands scoring remains fixed and policy changes.
 */
export class ExperimentEngine {
  /**
   * Run the intelligence pipeline for a user under a specific active experiment.
   */
  static runPipeline(
    userId: string,
    experiment: IntelligenceExperiment,
    input: ScoringInput
  ): { variant: ExperimentVariant; decision: PolicyDecision } {
    const trafficSplit = experiment.trafficSplit as TrafficSplit;

    // 1. Safety Guard Check (in production, we might log and fallback to control if invalid)
    const validation = ExperimentSafetyGuard.validateTrafficSplit(trafficSplit);
    let variant: ExperimentVariant = ExperimentVariant.CONTROL;

    if (validation.valid) {
      // 2. Deterministic Assignment (PER)
      variant = assignVariant(userId, experiment.id, trafficSplit);
    } else {
      console.warn(`[ExperimentEngine] Invalid traffic split for experiment ${experiment.id}: ${validation.reason}. Falling back to CONTROL.`);
    }

    // 3. Single Scoring Contract
    // ALL variants get the exact same score representation.
    const scoreResult = enforceSingleScoringContract(input);

    // 4. Policy Layer
    // The variant dictates the decision behavior based on the uniform score.
    const decision = applyVariantPolicy(variant, scoreResult);

    // Note: ActionExecutor logic (Phase 8 logging, constraints) would happen downstream
    // of this function, using the `decision` object.
    
    return { variant, decision };
  }
}
