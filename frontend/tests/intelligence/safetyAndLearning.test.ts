import { describe, it, expect, vi, beforeEach } from "vitest";
import { SafetyConstraints } from "../../lib/intelligence/safetyConstraints";
import { ActionOutcomeTracker } from "../../lib/intelligence/actionOutcomeTracker";
import { PerformanceAggregator } from "../../lib/intelligence/performanceAggregator";
import { ActionableRecommendation } from "../../lib/intelligence/types";
import { prisma } from "../../lib/prisma";
import { MockClock } from "../../lib/time/MockClock";

describe("Safety Constraints & Learning Layer", () => {
  const clock = new MockClock(new Date("2026-07-01T10:00:00Z"));

  beforeEach(async () => {
    await prisma.intelligenceActionLog.deleteMany();
    await prisma.subscription.deleteMany();
    // Safely delete MemberProfile if no Transactions exist, or just leave it.
    // We will ensure a test tenant and member exists.
    const tenant = await prisma.tenant.upsert({
      where: { slug: "test-tenant-safety" },
      update: {},
      create: { slug: "test-tenant-safety", name: "Safety Tenant", isActive: true }
    });

    const user = await prisma.user.upsert({
      where: { email: "safety@example.com" },
      update: {},
      create: { email: "safety@example.com", name: "Safety User" }
    });

    await prisma.memberProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { id: "test_member_1", userId: user.id }
    });
  });

  it("should enforce volume limits (max 5 campaigns/day)", async () => {
    const safety = new SafetyConstraints(clock);
    const tenant = await prisma.tenant.findUnique({ where: { slug: "test-tenant-safety" } });

    // Seed 5 executed campaigns for today
    for (let i = 0; i < 5; i++) {
      await prisma.intelligenceActionLog.create({
        data: {
          tenantId: tenant!.id,
          recommendationId: `rec_${i}`,
          actionType: "DISCOUNT",
          targetMemberId: "test_member_1",
          confidenceScore: 0.9,
          executionStatus: "EXECUTED",
          outcomeStatus: "PENDING",
          executedAt: new Date("2026-07-01T08:00:00Z")
        }
      });
    }

    const newIntent: ActionableRecommendation = {
      id: "rec_new",
      algorithmVersion: 2,
      explorationVersion: 1,
      explorationPolicy: "DETERMINISTIC_RANKING",
      title: "Test",
      description: "Test",
      impact: {},
      actionType: "DISCOUNT",
      confidenceScore: 0.9,
      requiresApproval: true,
      actionTemplate: "Test",
      executeMode: "semi-automated",
      targetMemberIds: ["test_member_1"],
      reasons: []
    };

    const safeIntents = await safety.enforce(tenant!.id, [newIntent]);
    expect(safeIntents.length).toBe(0); // Should be dropped due to volume limit
  });

  it("should enforce temporal deduplication (no repeat actions in 14 days)", async () => {
    const safety = new SafetyConstraints(clock);
    const tenant = await prisma.tenant.findUnique({ where: { slug: "test-tenant-safety" } });

    // Ensure user_2 exists
    const user2 = await prisma.user.upsert({
      where: { email: "safety2@example.com" },
      update: {},
      create: { email: "safety2@example.com", name: "Safety User 2" }
    });

    await prisma.memberProfile.upsert({
      where: { userId: user2.id },
      update: {},
      create: { id: "test_member_2", userId: user2.id }
    });

    // Seed a discount 5 days ago for test_member_1
    await prisma.intelligenceActionLog.create({
      data: {
        tenantId: tenant!.id,
        recommendationId: `rec_old`,
        actionType: "DISCOUNT",
        targetMemberId: `test_member_1`,
        confidenceScore: 0.9,
        executionStatus: "EXECUTED",
        outcomeStatus: "PENDING",
        executedAt: new Date("2026-06-26T08:00:00Z") // 5 days ago
      }
    });

    const newIntent: ActionableRecommendation = {
      id: "rec_new",
      algorithmVersion: 2,
      explorationVersion: 1,
      explorationPolicy: "DETERMINISTIC_RANKING",
      title: "Test",
      description: "Test",
      impact: {},
      actionType: "DISCOUNT",
      confidenceScore: 0.9,
      requiresApproval: true,
      actionTemplate: "Test",
      executeMode: "semi-automated",
      targetMemberIds: ["test_member_1", "test_member_2"],
      reasons: []
    };

    const safeIntents = await safety.enforce(tenant!.id, [newIntent]);
    expect(safeIntents[0].targetMemberIds).toEqual(["test_member_2"]); // test_member_1 filtered out
  });
});
