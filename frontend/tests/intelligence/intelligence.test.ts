import { describe, it, expect } from "vitest";
import { ActionExecutor } from "../../lib/intelligence/actionExecutor";
import { ActionableRecommendation } from "../../lib/intelligence/types";

describe("Actionable Intelligence Layer", () => {
  const executor = new ActionExecutor();

  it("should block manual execution through the automated executor", async () => {
    const rec: ActionableRecommendation = {
      id: "rec_1",
      algorithmVersion: 2,
      explorationVersion: 1,
      explorationPolicy: "DETERMINISTIC_RANKING",
      title: "Test",
      description: "Test",
      impact: {},
      actionType: "UPGRADE_SUGGESTION",
      confidenceScore: 0.9,
      requiresApproval: true,
      actionTemplate: "Upgrade",
      executeMode: "manual",
      targetMemberIds: ["user_3"],
      reasons: []
    };

    await expect(executor.executeRecommendation("tenant_1", rec, true)).rejects.toThrowError(/must be executed manually/);
  });

  it("should block execution if approval is required but not provided", async () => {
    const rec: ActionableRecommendation = {
      id: "rec_2",
      algorithmVersion: 2,
      explorationVersion: 1,
      explorationPolicy: "DETERMINISTIC_RANKING",
      title: "Test Discount",
      description: "Test",
      impact: {},
      actionType: "DISCOUNT",
      confidenceScore: 0.8,
      requiresApproval: true,
      actionTemplate: "Discount",
      executeMode: "semi-automated",
      targetMemberIds: ["user_2"],
      reasons: []
    };

    await expect(executor.executeRecommendation("tenant_1", rec, false)).rejects.toThrowError(/requires explicit admin approval/);
  });

  it("should simulate discount success rate properly based on confidence", async () => {
    const rec: ActionableRecommendation = {
      id: "rec_3",
      algorithmVersion: 2,
      explorationVersion: 1,
      explorationPolicy: "DETERMINISTIC_RANKING",
      title: "Test Discount",
      description: "Test",
      impact: { mrrAtRisk: 100000 },
      actionType: "DISCOUNT",
      confidenceScore: 0.90,
      requiresApproval: true,
      actionTemplate: "Discount",
      executeMode: "semi-automated",
      targetMemberIds: ["user_1", "user_2"],
      reasons: []
    };

    const sim = await executor.runRecommendationSimulation("tenant_1", rec);

    // success rate = 0.90 * 0.4 = 0.36
    expect(sim.projectedSuccessRate).toBe(0.36);
    // expected retained = 100000 * 0.36 = 36000
    expect(sim.expectedMrrRetained).toBe(36000);
    // cost = 100000 * 0.2 * 0.36 = 7200
    expect(sim.expectedCost).toBe(7200);
  });
});
