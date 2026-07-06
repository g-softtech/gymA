import { ActionableRecommendation, ExplorationPolicy } from "./types";

/**
 * A simple deterministic policy that ranks recommendations by confidence score.
 * It serves as a human-assist ranking rather than a fully autonomous selector.
 */
export class DeterministicRankingPolicy implements ExplorationPolicy {
  constructor(
    private threshold: number = 0.50, // Minimum confidence to surface
    private limit: number = 10        // Max items to return
  ) {}

  public rank<T extends ActionableRecommendation>(candidates: readonly T[]): T[] {
    return candidates
      .filter(c => c.confidenceScore >= this.threshold)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, this.limit);
  }
}
