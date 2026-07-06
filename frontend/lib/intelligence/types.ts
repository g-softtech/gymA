export type ActionType = "DISCOUNT" | "EMAIL" | "RETRY_PAYMENT" | "UPGRADE_SUGGESTION";
export type ExecuteMode = "manual" | "semi-automated" | "automatic";

export type RecommendationReasonCode = 
  | "LOW_ATTENDANCE" 
  | "EXPIRING_SOON" 
  | "FAILED_PAYMENT" 
  | "NO_ENGAGEMENT";

export interface RecommendationReason {
  code: RecommendationReasonCode;
  message: string;
  weight: number;
  evidence?: Record<string, unknown>;
}

export interface ScoringWeights {
  posteriorWeight: number;
  behaviorWeight: number;
}

export type ActionableRecommendation = {
  id: string;
  algorithmVersion: number;
  explorationVersion: number;
  explorationPolicy: "DETERMINISTIC_RANKING" | "THOMPSON" | "UCB" | "EPSILON_GREEDY";
  scoringSnapshot?: any;

  title: string;
  description: string;

  impact: {
    mrrAtRisk?: number;
    mrrPotential?: number;
  };

  actionType: ActionType;

  // 0.0 to 1.0 (e.g. 0.95 means 95% confident this action is appropriate)
  confidenceScore: number;

  requiresApproval: boolean;

  actionTemplate: string;

  executeMode: ExecuteMode;

  executeUrl?: string;

  // Added to track which users this impacts (for simulation/execution targets)
  targetMemberIds: string[];

  // Explains the reasoning behind the recommendation
  reasons: RecommendationReason[];
};

export interface ExplorationPolicy {
  rank<T extends ActionableRecommendation>(
    candidates: readonly T[]
  ): T[];
}

export type SimulationResult = {
  recommendationId: string;
  projectedSuccessRate: number; // 0.0 to 1.0
  expectedMrrRetained: number;
  expectedCost: number; // e.g. cost of discount
  membersReached: number;
  risks: string[];
};
