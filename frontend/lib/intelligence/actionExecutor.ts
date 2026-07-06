import { ActionableRecommendation, SimulationResult } from "./types";
import { notificationService } from "@/lib/notifications/notificationService";
import { prisma } from "@/lib/prisma";

export class ActionExecutor {
  /**
   * Run a simulation on a recommendation before committing any real-world actions.
   */
  async runRecommendationSimulation(tenantId: string, recommendation: ActionableRecommendation): Promise<SimulationResult> {
    const memberCount = recommendation.targetMemberIds.length;
    let successRate = 0;
    let expectedCost = 0;

    // Very simple heuristics for simulation
    if (recommendation.actionType === "DISCOUNT") {
      successRate = recommendation.confidenceScore * 0.4; // e.g. 40% of people take the 20% discount
      expectedCost = (recommendation.impact.mrrAtRisk || 0) * 0.2 * successRate; // 20% discount cost
    } else if (recommendation.actionType === "EMAIL") {
      successRate = recommendation.confidenceScore * 0.15; // lower conversion for pure email
      expectedCost = 0;
    } else if (recommendation.actionType === "RETRY_PAYMENT") {
      successRate = recommendation.confidenceScore * 0.5;
      expectedCost = 0;
    }

    const expectedMrrRetained = (recommendation.impact.mrrAtRisk || 0) * successRate;

    return {
      recommendationId: recommendation.id,
      projectedSuccessRate: Math.round(successRate * 100) / 100,
      expectedMrrRetained: Math.round(expectedMrrRetained),
      expectedCost: Math.round(expectedCost),
      membersReached: memberCount,
      risks: [
        recommendation.actionType === "DISCOUNT" ? "May condition users to wait for discounts." : "Low email open rates may reduce impact."
      ],
    };
  }

  /**
   * Safely execute an intent.
   * Throws if it requires approval but wasn't explicitly flagged as approved.
   */
  async executeRecommendation(
    tenantId: string, 
    recommendation: ActionableRecommendation,
    isApprovedByAdmin: boolean = false
  ): Promise<boolean> {
    if (recommendation.requiresApproval && !isApprovedByAdmin) {
      throw new Error(`Execution blocked: Recommendation '${recommendation.title}' requires explicit admin approval.`);
    }

    // High risk actions shouldn't even be processed here if they are purely manual
    if (recommendation.executeMode === "manual") {
      throw new Error(`Execution blocked: Action type '${recommendation.actionType}' must be executed manually.`);
    }

    // Audit the execution intent per member
    const logsData = recommendation.targetMemberIds.map(memberId => ({
      tenantId,
      recommendationId: recommendation.id,
      actionType: recommendation.actionType,
      targetMemberId: memberId,
      confidenceScore: recommendation.confidenceScore,
      algorithmVersion: recommendation.algorithmVersion,
      explorationVersion: recommendation.explorationVersion,
      explorationPolicy: recommendation.explorationPolicy as any, // Cast to any to avoid Prisma string-literal typing issues if types diverge slightly
      scoringSnapshot: recommendation.scoringSnapshot,
      executionStatus: "EXECUTED",
      outcomeStatus: "PENDING",
    }));

    await prisma.intelligenceActionLog.createMany({
      data: logsData
    });

    // Execute the actual side effects
    for (const memberId of recommendation.targetMemberIds) {
      if (recommendation.actionType === "DISCOUNT") {
        await notificationService.dispatch({
          tenantId,
          userId: memberId,
          type: "PROMO",
          title: "A special offer just for you!",
          message: "We've missed seeing you. Here is a 20% discount on your next month.",
          priority: "normal",
        });
      } else if (recommendation.actionType === "EMAIL") {
        await notificationService.dispatch({
          tenantId,
          userId: memberId,
          type: "SYSTEM",
          title: "Checking in on your fitness goals",
          message: "We noticed you haven't been around much. How can we help you stay on track?",
          priority: "normal",
        });
      }
      // Future: handle RETRY_PAYMENT and UPGRADE_SUGGESTION
    }

    return true;
  }
}
