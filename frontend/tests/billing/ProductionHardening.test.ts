import { prisma } from "../../lib/prisma";
import { POST } from "../../app/api/webhooks/platform-billing/route";
import crypto from "crypto";
import { runBillingReconciliationJob } from "../../lib/billing/billingReconciliationJob";
import { billingGuard } from "../../lib/billing/billingGuard";
import { NextRequest } from "next/server";
import { processPlatformSubscriptions } from "../../lib/subscriptions/platformLifecycleEngine";

describe("Production Hardening & System of Record Enforcement", () => {
  const MOCK_SIGNATURE = "mock_sig_hash";
  const TEST_TENANT_ID = "hardening_tenant_1";

  beforeAll(async () => {
    // Setup test tenant
    await prisma.tenant.upsert({
      where: { id: TEST_TENANT_ID },
      update: { billingStatus: "PENDING" },
      create: {
        id: TEST_TENANT_ID,
        name: "Hardening Test Gym",
        slug: "hardening-test-gym",
        billingStatus: "PENDING",
      }
    });

    vi.mock("../../lib/paystack", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../../lib/paystack")>();
      return {
        ...actual,
        verifyPaystackSignature: (body: string, sig: string) => sig === "mock_sig_hash",
      };
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    // Reset state before each test
    await prisma.tenant.update({
      where: { id: TEST_TENANT_ID },
      data: {
        billingStatus: "PENDING",
        billingEndsAt: null,
        trialEndsAt: null,
      }
    });
    await prisma.billingEvent.deleteMany({ where: { tenantId: TEST_TENANT_ID }});
    await prisma.saaSInvoice.deleteMany({ where: { tenantId: TEST_TENANT_ID }});
    await prisma.cronLock.deleteMany();
  });

  function createMockRequest(body: any, signature = MOCK_SIGNATURE) {
    return new NextRequest("http://localhost/api/webhooks/platform-billing", {
      method: "POST",
      headers: { "x-paystack-signature": signature },
      body: JSON.stringify(body),
    });
  }

  describe("Webhook Security & Idempotency", () => {
    it("should reject invalid signatures", async () => {
      const req = createMockRequest({ event: "charge.success", data: {} }, "wrong_sig");
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("should prevent duplicate webhook processing (replay attack)", async () => {
      const payload = {
        event: "charge.success",
        data: {
          reference: "charge_123",
          amount: 500000,
          metadata: { tenantId: TEST_TENANT_ID, targetPlan: "GROWTH" },
          customer: { customer_code: "CUS_123" }
        }
      };

      // 1st request succeeds
      const req1 = createMockRequest(payload);
      const res1 = await POST(req1);
      expect(res1.status).toBe(200);

      const eventsCount1 = await prisma.billingEvent.count({ where: { tenantId: TEST_TENANT_ID }});
      expect(eventsCount1).toBe(2); // The deduplication event AND the PAYMENT_SUCCESS event

      // 2nd request with same exact payload (replay)
      const req2 = createMockRequest(payload);
      const res2 = await POST(req2);
      expect(res2.status).toBe(200); // Must return 200 to ack Paystack

      // The event should NOT have been processed twice
      const eventsCount2 = await prisma.billingEvent.count({ where: { tenantId: TEST_TENANT_ID }});
      expect(eventsCount2).toBe(2);
    });
  });

  describe("Concurrency Controls", () => {
    it("should resolve optimistic concurrency conflicts safely", async () => {
      // Set to ACTIVE
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "ACTIVE", billingEndsAt: new Date(Date.now() - 1000) } // Expired
      });

      // Simulate a concurrent execution scenario
      // 1. Fetch tenant state
      const tenant = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID }});
      expect(tenant!.billingStatus).toBe("ACTIVE");

      // 2. Another process updates it first
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "PAST_DUE" }
      });

      // 3. We try to update using optimistic lock (updateMany where billingStatus = 'ACTIVE')
      const result = await prisma.tenant.updateMany({
        where: { id: TEST_TENANT_ID, billingStatus: "ACTIVE" },
        data: { billingStatus: "EXPIRED" }
      });

      // Update should have failed/skipped safely
      expect(result.count).toBe(0);
      
      const finalTenant = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID }});
      expect(finalTenant!.billingStatus).toBe("PAST_DUE"); // Was not overwritten
    });

    it("should handle webhook + cron concurrency without data corruption", async () => {
      // This is a stress test. 
      const payload = {
        event: "charge.success",
        data: {
          reference: "charge_stress_1",
          amount: 500000,
          metadata: { tenantId: TEST_TENANT_ID, targetPlan: "GROWTH" },
          customer: { customer_code: "CUS_123" }
        }
      };

      await Promise.all([
        POST(createMockRequest(payload)),
        runBillingReconciliationJob(),
      ]);

      const t = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID }});
      // The webhook makes it ACTIVE with a future end date, the cron job should skip because it's not expired anymore.
      expect(t!.billingStatus).toBe("ACTIVE");
    });
  });

  describe("Billing Guard & Lifecycle Enforcement", () => {
    it("should deny access to expired tenants", async () => {
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "EXPIRED" }
      });

      const req = new NextRequest("http://localhost/api/protected", {
        headers: { "x-tenant-id": TEST_TENANT_ID }
      });
      const response = await billingGuard(req);
      expect(response).not.toBeNull();
      expect(response?.headers.get("Location")).toContain("/billing/blocked");
    });

    it("should deny access to suspended tenants", async () => {
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "SUSPENDED" }
      });

      const req = new NextRequest("http://localhost/api/protected", {
        headers: { "x-tenant-id": TEST_TENANT_ID }
      });
      const response = await billingGuard(req);
      expect(response).not.toBeNull();
      expect(response?.headers.get("Location")).toContain("/billing/blocked");
    });

    it("should allow access during grace period", async () => {
      // Billing ended 2 days ago (within 7 day grace period)
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "GRACE_PERIOD", billingEndsAt: new Date(Date.now() - 2 * 86400000) }
      });

      const req = new NextRequest("http://localhost/api/protected", {
        headers: { "x-tenant-id": TEST_TENANT_ID }
      });
      const response = await billingGuard(req);
      expect(response).toBeNull(); // Allowed
    });

    it("should transition ACTIVE to GRACE_PERIOD when time passes", async () => {
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "ACTIVE", billingEndsAt: new Date(Date.now() - 1000) } // Just expired
      });

      await processPlatformSubscriptions();

      const t = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID }});
      expect(t!.billingStatus).toBe("GRACE_PERIOD");
    });

    it("should transition GRACE_PERIOD to EXPIRED when 7 days pass", async () => {
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "GRACE_PERIOD", billingEndsAt: new Date(Date.now() - 8 * 86400000) } // 8 days ago
      });

      await processPlatformSubscriptions();

      const t = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID }});
      expect(t!.billingStatus).toBe("EXPIRED");
    });
    
    it("should transition TRIALING to PAST_DUE when trial expires", async () => {
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "TRIALING", trialEndsAt: new Date(Date.now() - 1000), billingEndsAt: null }
      });

      await processPlatformSubscriptions();

      const t = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID }});
      expect(t!.billingStatus).toBe("PAST_DUE");
    });

    it("should recover correctly after late payment", async () => {
      await prisma.tenant.update({
        where: { id: TEST_TENANT_ID },
        data: { billingStatus: "PAST_DUE", billingEndsAt: new Date(Date.now() - 10 * 86400000) }
      });

      // Paystack charge.success webhook comes in late
      const req = createMockRequest({
        event: "charge.success",
        data: {
          reference: "late_payment_123",
          amount: 500000,
          metadata: { tenantId: TEST_TENANT_ID, targetPlan: "GROWTH" },
          customer: { customer_code: "CUS_123" }
        }
      });
      await POST(req);

      const t = await prisma.tenant.findUnique({ where: { id: TEST_TENANT_ID }});
      expect(t!.billingStatus).toBe("ACTIVE");
      expect(t!.billingEndsAt!.getTime()).toBeGreaterThan(Date.now());
    });
  });

});
