import { ScoringWeights } from "./types";

export interface ConfidenceInput {
  historicalSuccessRate: number;
  historicalFailureRate: number;
  behavioralDeviation: number; // 0 to 1
  ageInDays: number;
  lambdaDecay: number;
  sampleCount: number;
  weights: ScoringWeights;
}

export interface ConfidenceResult {
  score: number;
  algorithmVersion: number;
  snapshot: ConfidenceInput;
}

export class ScoringEngine {
  /**
   * Calculates the final bounded confidence score for an action based on historical performance, 
   * behavioral deviation, and time decay. 
   * This is a pure mathematical function.
   */
  public calculate(input: ConfidenceInput): ConfidenceResult {
    // 1. Bayesian Posterior Mean
    // Weak priors (alpha0 = 2, beta0 = 2)
    const alpha0 = 2;
    const beta0 = 2;

    const successes = input.historicalSuccessRate * input.sampleCount;
    const failures = input.historicalFailureRate * input.sampleCount;

    const alpha = alpha0 + successes;
    const beta = beta0 + failures;

    // Expected value of the Beta distribution
    const mu = alpha / (alpha + beta);
    
    // Normalize behavior
    const B = Math.max(0, Math.min(1, input.behavioralDeviation));

    // 2. Blend Posterior Mean with Behavioral Signal
    const S_behavior = (input.weights.posteriorWeight * mu) + (input.weights.behaviorWeight * B);

    // 3. Time Decay Weighting
    // We decay the behavioral adjustment back toward the historical mean
    const D = Math.exp(-input.lambdaDecay * input.ageInDays);
    const S_time = (S_behavior * D) + (mu * (1 - D));

    // 4. Final clamp
    const score = Math.max(0, Math.min(1, S_time));

    return {
      score,
      algorithmVersion: 2, // Phase 7.2 bumps the algorithm version to 2 (Bayesian)
      snapshot: input
    };
  }
}

