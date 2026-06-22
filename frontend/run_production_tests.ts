import { prisma } from "./lib/prisma";
import { randomUUID } from "crypto";

const VERCEL_URL = "https://cortexfit.vercel.app";

async function runProductionTests() {
  console.log("=== CORTEXFIT PRODUCTION ENTITLEMENTS AUDIT ===");
  
  // 1. Setup Test Data
  console.log("[Setup] Creating isolated test tenant and users...");
  const tenant = await prisma.tenant.create({
    data: { name: "Audit Gym", slug: "audit-gym-" + Date.now() }
  });

  const tenantB = await prisma.tenant.create({
    data: { name: "Other Gym", slug: "other-gym-" + Date.now() }
  });

  const testUser = await prisma.user.create({
    data: {
      name: "Audit User",
      email: "audit" + Date.now() + "@example.com",
      tenantId: tenant.id,
      role: "MEMBER"
    }
  });

  const memberProfile = await prisma.memberProfile.create({
    data: { userId: testUser.id }
  });

  // Create active session token manually
  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      sessionToken,
      userId: testUser.id,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    }
  });

  // Create custom plan with strict limits
  const plan = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant.id,
      name: "Audit Plan",
      price: 1000,
      durationDays: 30,
      entitlements: {
        version: 1,
        MAX_CLASSES_PER_MONTH: 1,
        AI_ACCESS: false,
        MAX_TRAINER_SESSIONS: 0
      }
    }
  });

  // Create active subscription
  const subscription = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      memberId: memberProfile.id,
      planId: plan.id,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Create a dummy class
  const dummyClass = await prisma.classSession.create({
    data: {
      tenantId: tenant.id,
      title: "Audit Class Title",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMins: 60,
      capacity: 10,
    }
  });

  const headers = {
    "Cookie": `next-auth.session-token=${sessionToken}`,
    "Content-Type": "application/json"
  };

  try {
    // === TEST 1: Booking Limit (MAX_CLASSES_PER_MONTH: 1) ===
    console.log("\n[Test 1] Booking Limit Enforcement");
    
    // First booking should succeed (or be pending payment)
    let res = await fetch(`${VERCEL_URL}/api/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify({ classSessionId: dummyClass.id, notes: "1st booking" })
    });
    
    // Since payment isn't handled here, we just insert the booking directly to bypass the payment check
    await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        memberId: memberProfile.id,
        classSessionId: dummyClass.id,
        date: new Date(),
        durationMins: 60,
        status: "CONFIRMED"
      }
    });

    // Second booking should fail
    res = await fetch(`${VERCEL_URL}/api/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify({ classSessionId: dummyClass.id, notes: "2nd booking" })
    });
    const body1 = await res.json();
    if (res.status === 403 && body1.error.includes("limit")) {
      console.log("✅ Test 1 Passed: Second booking rejected. Error:", body1.error);
    } else {
      console.error("❌ Test 1 Failed. Expected 403 limit error, got", res.status, body1);
    }

    // === TEST 2: AI Access (AI_ACCESS: false) ===
    console.log("\n[Test 2] AI Access Enforcement");
    res = await fetch(`${VERCEL_URL}/api/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] })
    });
    const body2 = await res.json();
    if (res.status === 403 && body2.error.includes("not included")) {
      console.log("✅ Test 2 Passed: AI request rejected. Error:", body2.error);
    } else {
      console.error("❌ Test 2 Failed. Expected 403, got", res.status, body2);
    }

    // === TEST 3: Tenant Isolation ===
    console.log("\n[Test 3] Tenant Isolation (Using Gym B plan)");
    const otherPlan = await prisma.membershipPlan.create({
      data: {
        tenantId: tenantB.id,
        name: "Other Gym Plan",
        price: 500,
        durationDays: 30,
        entitlements: { "unlimitedEverything": true } // Mock bad data
      }
    });
    
    // Attempting to fetch plans from other tenant (simulated by verifying PlanManager logic locally or hitting the endpoint)
    // The GET /api/plans route is secured by `getTenantContextFromSession`
    res = await fetch(`${VERCEL_URL}/api/plans`, { method: "GET", headers });
    const plans = await res.json();
    const seesOtherPlan = plans.some((p: any) => p.tenantId === tenantB.id);
    if (!seesOtherPlan) {
      console.log("✅ Test 3 Passed: User cannot see or access Gym B's plans.");
    } else {
      console.error("❌ Test 3 Failed. User saw isolated tenant data.");
    }

    // === TEST 4: Subscription Absence ===
    console.log("\n[Test 4] Subscription Absence");
    // Cancel subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED" }
    });
    
    res = await fetch(`${VERCEL_URL}/api/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] })
    });
    const body4 = await res.json();
    if (res.status === 403 && body4.error.includes("No active subscription")) {
      console.log("✅ Test 4 Passed: Empty subscription fails closed. Error:", body4.error);
    } else {
      console.error("❌ Test 4 Failed. Expected 403 No active sub, got", res.status, body4);
    }

  } catch (error) {
    console.error("Execution error:", error);
  } finally {
    console.log("\n[Cleanup] Removing audit data...");
    await prisma.session.deleteMany({ where: { userId: testUser.id } });
    await prisma.booking.deleteMany({ where: { memberId: memberProfile.id } });
    await prisma.subscription.deleteMany({ where: { memberId: memberProfile.id } });
    await prisma.classSession.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.membershipPlan.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.membershipPlan.deleteMany({ where: { tenantId: tenantB.id } });
    await prisma.memberProfile.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenantB.id } });
    
    await prisma.$disconnect();
    console.log("=== AUDIT COMPLETE ===");
  }
}

runProductionTests();
