import { IntelligenceExperiment } from "@prisma/client";
import { GovernanceEngine } from "./governanceEngine";
import { ExperimentEngine } from "./experimentEngine";

/**
 * The Master Intelligence Pipeline.
 * 
 * Architecture Flow:
 * Request → GovernanceEngine (Kill Switch) → ExperimentEngine (Routing) 
 *  → ScoringEngine (Fixed Truth) → Policy (Variant Behavior) → ActionExecutor
 */
export class IntelligencePipeline {
  
  static async executeDecision(
    tenantId: string, 
    userId: string, 
    experiment: IntelligenceExperiment, 
    input: any
  ) {
    // 1. Governance Layer (Kill Switch Interception)
    // Runs BEFORE any AI logic or scoring occurs
    const killSwitch = await GovernanceEngine.evaluateKillSwitch(tenantId);
    
    if (killSwitch.active) {
      console.warn(`[IntelligencePipeline] AI Intercepted by Kill Switch: ${killSwitch.reason}`);
      return {
        executed: false,
        fallback: true,
        reason: killSwitch.reason,
        decision: { actionType: "MANUAL_FALLBACK", explorationPolicy: "NONE" }
      };
    }

    // 2. Experimentation & Scoring Layer
    // Safely delegates to the PER router -> single scoring contract -> variant policy
    const { variant, decision } = ExperimentEngine.runPipeline(userId, experiment, input);

    // 3. Action Execution (Phase 8 execution logic)
    // This is where we would normally trigger notifications, write the ActionLog, etc.
    // e.g. ActionExecutor.execute(decision, ...)

    return {
      executed: true,
      fallback: false,
      variant,
      decision
    };
  }
}
