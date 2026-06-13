import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Import route handlers to test
import { POST as MealPlanPOST } from "@/app/api/member/nutrition/meal-plans/route";
import { POST as FoodLogPOST } from "@/app/api/member/nutrition/food-log/route";
import { POST as BookingsPOST } from "@/app/api/bookings/route";
import { POST as AttendancePOST } from "@/app/api/attendance/route";
import { POST as PaymentVerifyPOST } from "@/app/api/payments/verify/route";

// Global Mock variables to easily switch users
let mockSessionId = "";
let mockSessionRole = "MEMBER";
let mockSessionTenantId = "";

vi.mock("@/lib/auth", () => ({
  getAuthSession: async () => {
    if (!mockSessionId) return null;
    return {
      user: {
        id: mockSessionId,
        role: mockSessionRole,
        tenantId: mockSessionTenantId,
      },
    };
  },
}));

describe("Phase 9C: Multi-Tenant Security Boundaries", () => {
  let tenantA: any;
  let tenantB: any;
  let memberA: any;
  let memberProfileA: any;
  let trainerA: any;
  let trainerProfileA: any;
  let memberB: any;
  let memberProfileB: any;
  let trainerB: any;
  let trainerProfileB: any;
  let planB: any;

  beforeAll(async () => {
    // 0. Clean up stale test data from previous runs
    await prisma.user.deleteMany({
      where: { email: { in: ["memberA@test.com", "trainerA@test.com", "memberB@test.com", "trainerB@test.com"] } },
    });
    await prisma.tenant.deleteMany({
      where: { slug: { in: ["tenant-a-test", "tenant-b-test"] } },
    });

    // 1. Create Tenant A
    tenantA = await prisma.tenant.create({
      data: { name: "Tenant A", slug: "tenant-a-test" },
    });

    // 2. Create Tenant B
    tenantB = await prisma.tenant.create({
      data: { name: "Tenant B", slug: "tenant-b-test" },
    });

    // 3. Create Users in Tenant A
    memberA = await prisma.user.create({
      data: { email: "memberA@test.com", role: "MEMBER", tenantId: tenantA.id },
    });
    memberProfileA = await prisma.memberProfile.create({
      data: { userId: memberA.id, fitnessGoals: [] },
    });

    trainerA = await prisma.user.create({
      data: { email: "trainerA@test.com", role: "TRAINER", tenantId: tenantA.id },
    });
    trainerProfileA = await prisma.trainerProfile.create({
      data: { userId: trainerA.id, availability: {} },
    });

    // 4. Create Users and Plans in Tenant B
    memberB = await prisma.user.create({
      data: { email: "memberB@test.com", role: "MEMBER", tenantId: tenantB.id },
    });
    memberProfileB = await prisma.memberProfile.create({
      data: { userId: memberB.id, fitnessGoals: [] },
    });

    trainerB = await prisma.user.create({
      data: { email: "trainerB@test.com", role: "TRAINER", tenantId: tenantB.id },
    });
    trainerProfileB = await prisma.trainerProfile.create({
      data: { userId: trainerB.id, availability: {} },
    });

    planB = await prisma.membershipPlan.create({
      data: { tenantId: tenantB.id, name: "Plan B", price: 100, durationDays: 30 },
    });
  });

  afterAll(async () => {
    // Clean up all data created in test DB
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantA.id, tenantB.id] } },
    });
  });

  describe("Cross-Tenant Attacks (Expected 403 / 404)", () => {
    beforeAll(() => {
      // Act as Member A
      mockSessionId = memberA.id;
      mockSessionRole = "MEMBER";
      mockSessionTenantId = tenantA.id;
    });

    it("Meal Plan: Should reject cross-tenant meal plan generation", async () => {
      const req = new NextRequest("http://localhost/api/member/nutrition/meal-plans", {
        method: "POST",
        body: JSON.stringify({
          memberId: memberProfileB.id, // Target Member B in Tenant B
          title: "Hacked Plan",
          goal: "WEIGHT_LOSS",
          totalCalories: 2000,
          protein: 150,
          carbs: 200,
          fats: 50,
          meals: [],
          isAiGenerated: false,
        }),
      });

      const res = await MealPlanPOST(req);
      expect(res.status).toBe(403);
    });

    it("Food Log: Should reject cross-tenant food logging", async () => {
      const req = new NextRequest("http://localhost/api/member/nutrition/food-log", {
        method: "POST",
        body: JSON.stringify({
          memberId: memberProfileB.id, // Target Member B
          mealType: "Breakfast",
          foodName: "Apple",
          calories: 100,
          protein: 0,
          carbs: 25,
          fats: 0,
          quantity: 1,
          unit: "apple",
          date: new Date().toISOString(),
        }),
      });

      const res = await FoodLogPOST(req);
      expect(res.status).toBe(403);
    });

    it("Bookings: Should reject cross-tenant trainer booking", async () => {
      const req = new NextRequest("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          trainerId: trainerProfileB.id, // Target Trainer B
          date: new Date().toISOString(),
          durationMins: 60,
          sessionType: "PHYSICAL",
        }),
      });

      const res = await BookingsPOST(req);
      expect(res.status).toBe(403);
    });

    it("Attendance: Should reject cross-tenant attendance marking by Trainer", async () => {
      // Act as Trainer A
      mockSessionId = trainerA.id;
      mockSessionRole = "TRAINER";
      mockSessionTenantId = tenantA.id;

      const req = new NextRequest("http://localhost/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          memberId: memberProfileB.id, // Trainer A trying to mark Member B
          note: "Hacked Checkin",
        }),
      });

      const res = await AttendancePOST(req);
      expect(res.status).toBe(403);
    });

    it("Payment Verification: Should reject cross-tenant subscription spoofing", async () => {
      // Act as Member A
      mockSessionId = memberA.id;
      mockSessionRole = "MEMBER";
      mockSessionTenantId = tenantA.id;

      const req = new NextRequest("http://localhost/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          reference: "fake_reference_123",
          planId: planB.id, // Member A trying to buy Plan B
          tenantSlug: tenantB.slug,
        }),
      });

      const res = await PaymentVerifyPOST(req);
      expect(res.status).toBe(403);
    });
  });

  describe("Same-Tenant Positive Tests (Expected 200/201)", () => {
    beforeAll(() => {
      // Act as Member A
      mockSessionId = memberA.id;
      mockSessionRole = "MEMBER";
      mockSessionTenantId = tenantA.id;
    });

    it("Meal Plan: Should allow same-tenant meal plan generation", async () => {
      const req = new NextRequest("http://localhost/api/member/nutrition/meal-plans", {
        method: "POST",
        body: JSON.stringify({
          memberId: memberProfileA.id, // Own Profile
          title: "My Plan",
          goal: "WEIGHT_LOSS",
          totalCalories: 2000,
          protein: 150,
          carbs: 200,
          fats: 50,
          meals: [],
          isAiGenerated: false,
        }),
      });

      const res = await MealPlanPOST(req);
      expect(res.status).toBe(201);
    });

    it("Food Log: Should allow same-tenant food logging", async () => {
      const req = new NextRequest("http://localhost/api/member/nutrition/food-log", {
        method: "POST",
        body: JSON.stringify({
          memberId: memberProfileA.id, // Own Profile
          mealType: "Breakfast",
          foodName: "Apple",
          calories: 100,
          protein: 0,
          carbs: 25,
          fats: 0,
          quantity: 1,
          unit: "apple",
          date: new Date().toISOString(),
        }),
      });

      const res = await FoodLogPOST(req);
      expect(res.status).toBe(201);
    });

    it("Bookings: Should allow same-tenant trainer booking", async () => {
      const req = new NextRequest("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          trainerId: trainerProfileA.id, // Own Gym Trainer
          date: new Date().toISOString(),
          durationMins: 60,
          sessionType: "PHYSICAL",
        }),
      });

      const res = await BookingsPOST(req);
      expect(res.status).toBe(201);
    });
  });
});
