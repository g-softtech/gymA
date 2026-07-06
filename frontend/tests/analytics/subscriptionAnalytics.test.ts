import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { prisma } from "../../lib/prisma";
import { MockClock } from "../../lib/time/MockClock";
import { SubscriptionAnalyticsRepository } from "../../lib/subscriptions/analytics/subscriptionAnalyticsRepository";
import { SubscriptionAnalyticsService } from "../../lib/subscriptions/analytics/subscriptionAnalyticsService";

describe("Subscription Analytics Service", () => {
  const tenantId = "analytics_test_tenant";
  let clock: MockClock;
  let service: SubscriptionAnalyticsService;

  beforeAll(async () => {
    // Ensure tenant exists
    await prisma.tenant.upsert({
      where: { id: tenantId },
      create: { id: tenantId, name: "Analytics Test Gym", slug: "analytics-test-gym" },
      update: {},
    });

    await prisma.membershipPlan.upsert({
      where: { id: "plan_monthly" },
      create: { id: "plan_monthly", tenantId, name: "Monthly", price: 10000, durationDays: 30 },
      update: {},
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transaction.deleteMany({ where: { tenantId } });
    await prisma.subscription.deleteMany({ where: { tenantId } });
    await prisma.memberProfile.deleteMany({ where: { user: { tenantId } } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.membershipPlan.deleteMany({ where: { tenantId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
  });

  beforeEach(async () => {
    // Clear data before each test
    await prisma.transaction.deleteMany({ where: { tenantId } });
    await prisma.subscription.deleteMany({ where: { tenantId } });
    await prisma.memberProfile.deleteMany({ where: { user: { tenantId } } });
    await prisma.user.deleteMany({ where: { tenantId } });

    clock = new MockClock("2024-06-15T12:00:00Z"); // Default mid-month
    const repo = new SubscriptionAnalyticsRepository(clock);
    service = new SubscriptionAnalyticsService(repo, clock);
  });

  async function createTestMember(id: string) {
    const user = await prisma.user.create({
      data: { id, email: `${id}@test.com`, tenantId, name: id },
    });
    return await prisma.memberProfile.create({
      data: { id: `profile_${id}`, userId: user.id },
    });
  }

  it("should return correct distribution for an empty tenant", async () => {
    const from = new Date("2024-06-01T00:00:00Z");
    const to = new Date("2024-06-30T23:59:59Z");
    
    const metrics = await service.getDashboardMetrics(tenantId, from, to, "month");

    expect(metrics.renewalRate).toBe(0);
    expect(metrics.retentionRate).toBe(0);
    expect(metrics.recoveryRate).toBe(0);
    expect(metrics.averageLifetimeMonths).toBe(0);
    expect(metrics.upcomingRevenueAtRisk).toBe(0);
    expect(metrics.expiringTrend.length).toBe(0);
    // There is one plan seeded in beforeAll, it should have 0 active subscribers
    expect(metrics.distribution.length).toBe(1);
    expect(metrics.distribution[0].count).toBe(0);
  });

  it("should calculate 100% renewal rate when all eligible are renewed", async () => {
    const member = await createTestMember("user_renewal_1");
    
    // An old subscription that expired inside the period
    await prisma.subscription.create({
      data: {
        id: "sub_1",
        tenantId,
        memberId: member.id,
        planId: "plan_monthly",
        startDate: new Date("2024-05-05T00:00:00Z"),
        endDate: new Date("2024-06-05T00:00:00Z"), // Expires inside period
        status: "REPLACED",
      }
    });

    // The renewal that is currently active and extends past the period
    await prisma.subscription.create({
      data: {
        id: "sub_2",
        tenantId,
        memberId: member.id,
        planId: "plan_monthly",
        startDate: new Date("2024-06-05T00:00:00Z"),
        endDate: new Date("2024-07-05T00:00:00Z"),
        status: "ACTIVE",
      }
    });

    const from = new Date("2024-06-01T00:00:00Z");
    const to = new Date("2024-06-30T23:59:59Z");
    const metrics = await service.getDashboardMetrics(tenantId, from, to, "month");

    expect(metrics.renewalRate).toBe(100);
  });

  it("should calculate 0% renewal rate when eligible are not renewed", async () => {
    const member = await createTestMember("user_renewal_0");
    
    // Expires inside period, but NO active subscription follows
    await prisma.subscription.create({
      data: {
        id: "sub_3",
        tenantId,
        memberId: member.id,
        planId: "plan_monthly",
        startDate: new Date("2024-05-10T00:00:00Z"),
        endDate: new Date("2024-06-10T00:00:00Z"),
        status: "EXPIRED",
      }
    });

    const from = new Date("2024-06-01T00:00:00Z");
    const to = new Date("2024-06-30T23:59:59Z");
    const metrics = await service.getDashboardMetrics(tenantId, from, to, "month");

    expect(metrics.renewalRate).toBe(0);
  });

  it("should calculate recovery rate correctly across boundaries", async () => {
    const member1 = await createTestMember("user_recovery_1");
    const member2 = await createTestMember("user_recovery_2");
    
    // Initial failure for Member 1
    await prisma.transaction.create({
      data: {
        id: "tx_fail",
        tenantId,
        memberId: member1.id,
        itemName: "Monthly Plan",
        itemType: "MEMBERSHIP",
        amount: 10000,
        currency: "NGN",
        status: "FAILED",
        reference: "ref_fail",
        createdAt: new Date("2024-06-02T10:00:00Z"),
      }
    });

    // Success at exactly 14 days (should recover Member 1)
    await prisma.transaction.create({
      data: {
        id: "tx_succ_14",
        tenantId,
        memberId: member1.id,
        itemName: "Monthly Plan",
        itemType: "MEMBERSHIP",
        amount: 10000,
        currency: "NGN",
        status: "SUCCESS",
        reference: "ref_succ_14",
        createdAt: new Date("2024-06-16T10:00:00Z"),
      }
    });

    // Another failure for Member 2
    await prisma.transaction.create({
      data: {
        id: "tx_fail_2",
        tenantId,
        memberId: member2.id,
        itemName: "Monthly Plan",
        itemType: "MEMBERSHIP",
        amount: 10000,
        currency: "NGN",
        status: "FAILED",
        reference: "ref_fail_2",
        createdAt: new Date("2024-06-03T10:00:00Z"),
      }
    });

    // Success at 14 days + 1 second (should NOT recover Member 2)
    await prisma.transaction.create({
      data: {
        id: "tx_succ_late",
        tenantId,
        memberId: member2.id,
        itemName: "Monthly Plan",
        itemType: "MEMBERSHIP",
        amount: 10000,
        currency: "NGN",
        status: "SUCCESS",
        reference: "ref_succ_late",
        createdAt: new Date("2024-06-17T10:00:01Z"),
      }
    });

    const from = new Date("2024-06-01T00:00:00Z");
    const to = new Date("2024-06-30T23:59:59Z");
    
    const metrics = await service.getDashboardMetrics(tenantId, from, to, "month", 14);

    // 2 total failures. 1 recovered within 14 days, 1 missed window. Rate = 50%
    expect(metrics.recoveryRate).toBe(50);
  });

  it("should calculate retention safely", async () => {
    const memberStart = await createTestMember("user_retention_start");
    const memberNew = await createTestMember("user_retention_new");
    
    // Active at start (Ends far in future)
    await prisma.subscription.create({
      data: {
        id: "sub_ret_1",
        tenantId,
        memberId: memberStart.id,
        planId: "plan_monthly",
        startDate: new Date("2024-05-01T00:00:00Z"),
        endDate: new Date("2024-07-01T00:00:00Z"),
        status: "ACTIVE",
      }
    });

    // New during period
    await prisma.subscription.create({
      data: {
        id: "sub_ret_2",
        tenantId,
        memberId: memberNew.id,
        planId: "plan_monthly",
        startDate: new Date("2024-06-15T00:00:00Z"),
        endDate: new Date("2024-07-15T00:00:00Z"),
        status: "ACTIVE",
      }
    });

    const from = new Date("2024-06-01T00:00:00Z");
    const to = new Date("2024-06-30T23:59:59Z");
    
    const metrics = await service.getDashboardMetrics(tenantId, from, to, "month");

    // Start = 1. End = 2. New = 1.
    // Retention = (2 - 1) / 1 = 100%
    expect(metrics.retentionRate).toBe(100);
  });

  it("should accurately report upcoming revenue at risk", async () => {
    const member1 = await createTestMember("user_risk_1");
    const member2 = await createTestMember("user_risk_2");

    clock.set("2024-06-01T00:00:00Z"); // Set clock strictly to test revenue at risk

    // Expires in 10 days (At risk)
    await prisma.subscription.create({
      data: {
        id: "sub_risk_1",
        tenantId,
        memberId: member1.id,
        planId: "plan_monthly", // Price 10000
        startDate: new Date("2024-05-11T00:00:00Z"),
        endDate: new Date("2024-06-11T00:00:00Z"),
        status: "ACTIVE",
      }
    });

    // Expires in 40 days (NOT at risk)
    await prisma.subscription.create({
      data: {
        id: "sub_risk_2",
        tenantId,
        memberId: member2.id,
        planId: "plan_monthly",
        startDate: new Date("2024-06-01T00:00:00Z"),
        endDate: new Date("2024-07-11T00:00:00Z"),
        status: "ACTIVE",
      }
    });

    // Cancelled (NOT at risk, since it's already cancelled)
    await prisma.subscription.create({
      data: {
        id: "sub_risk_3",
        tenantId,
        memberId: member1.id, // Multiple subs
        planId: "plan_monthly",
        startDate: new Date("2024-05-15T00:00:00Z"),
        endDate: new Date("2024-06-15T00:00:00Z"),
        status: "CANCELLED",
      }
    });

    const metrics = await service.getDashboardMetrics(
      tenantId, 
      new Date("2024-06-01T00:00:00Z"), 
      new Date("2024-06-30T23:59:59Z"), 
      "month"
    );

    // Only 1 sub is at risk (expires in 10 days), price = 10000
    expect(metrics.upcomingRevenueAtRisk).toBe(10000);
  });

  it("should accurately report average lifetime duration", async () => {
    const member1 = await createTestMember("user_life_1");
    
    // Member had a subscription for exactly 2 months
    await prisma.subscription.create({
      data: {
        id: "sub_life_1",
        tenantId,
        memberId: member1.id,
        planId: "plan_monthly",
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-03-01T00:00:00Z"), // 60 days
        status: "EXPIRED",
      }
    });

    const metrics = await service.getDashboardMetrics(
      tenantId, 
      new Date("2024-06-01T00:00:00Z"), 
      new Date("2024-06-30T23:59:59Z"), 
      "month"
    );

    // 60 days / 30 = 2 months exactly
    expect(metrics.averageLifetimeMonths).toBeCloseTo(2.0, 1);
  });

  it("should handle leap year correctly", async () => {
    const member = await createTestMember("user_leap");
    
    // Feb 29, 2024 exists!
    await prisma.subscription.create({
      data: {
        id: "sub_leap",
        tenantId,
        memberId: member.id,
        planId: "plan_monthly",
        startDate: new Date("2024-02-01T00:00:00Z"),
        endDate: new Date("2024-02-29T00:00:00Z"), 
        status: "ACTIVE",
      }
    });

    const from = new Date("2024-02-01T00:00:00Z");
    const to = new Date("2024-02-29T23:59:59Z");
    
    const metrics = await service.getDashboardMetrics(tenantId, from, to, "day");
    
    // Ensure trend includes the expiry on 29th
    expect(metrics.expiringTrend.length).toBeGreaterThan(0);
  });
});
