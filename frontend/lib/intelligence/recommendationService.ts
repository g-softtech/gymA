import { Clock } from "@/lib/time/Clock";
import { ChurnRiskEngine } from "./churnRiskEngine";
import { ActionableRecommendation } from "./types";
import { SafetyConstraints } from "./safetyConstraints";

export class RecommendationService {
  private churnEngine: ChurnRiskEngine;
  private safetyConstraints: SafetyConstraints;

  constructor(private readonly clock: Clock) {
    this.churnEngine = new ChurnRiskEngine(clock);
    this.safetyConstraints = new SafetyConstraints(clock);
  }

  /**
   * Generates pure intent objects representing actions the business should take.
   * No side effects occur during generation.
   */
  async generateAllRecommendations(tenantId: string): Promise<ActionableRecommendation[]> {
    const recommendations: ActionableRecommendation[] = [];

    // 1. Churn Risk
    const churnRecs = await this.churnEngine.analyze(tenantId);
    recommendations.push(...churnRecs);

    // Future: 
    // const recoveryRecs = await this.recoveryEngine.analyze(tenantId);
    // recommendations.push(...recoveryRecs);
    //
    // const upsellRecs = await this.upsellEngine.analyze(tenantId);
    // recommendations.push(...upsellRecs);

    // Apply Guardrails
    const safeRecommendations = await this.safetyConstraints.enforce(tenantId, recommendations);

    // Sort by confidence (highest first) and impact
    return safeRecommendations.sort((a, b) => {
      // Prioritize high confidence
      if (b.confidenceScore !== a.confidenceScore) {
        return b.confidenceScore - a.confidenceScore;
      }
      // Then prioritize impact
      const impactA = a.impact.mrrAtRisk || a.impact.mrrPotential || 0;
      const impactB = b.impact.mrrAtRisk || b.impact.mrrPotential || 0;
      return impactB - impactA;
    });
  }
}
