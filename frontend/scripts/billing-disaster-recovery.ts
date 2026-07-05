import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { POST } from "../app/api/webhooks/platform-billing/route";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "test_secret";
process.env.PAYSTACK_SECRET_KEY = PAYSTACK_SECRET_KEY; // Ensure it's set for the test

function signPayload(payloadStr: string): string {
  return crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payloadStr)
    .digest("hex");
}

async function simulateWebhook(payload: any) {
  const rawBody = JSON.stringify(payload);
  const signature = signPayload(rawBody);

  const request = new Request("http://localhost:3000/api/webhooks/platform-billing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": signature,
    },
    body: rawBody,
  });

  const response = await POST(request);
  const text = await response.text();
  console.log(`[DR] Webhook ${payload.event} processed with status: ${response.status}`, text);
  return response;
}

async function runDisasterRecovery() {
  console.log("[DR] Starting Billing Disaster Recovery Simulation...");

  // 1. Setup mock tenant
  const tenantSlug = "dr-test-gym-" + Date.now();
  const tenant = await prisma.tenant.create({
    data: {
      name: "DR Test Gym",
      slug: tenantSlug,
      plan: "STARTER",
      billingStatus: "PENDING",
      settings: {
        create: {
          paystackCustomerCode: `CUS_drtest_${Date.now()}`
        }
      }
    },
    include: { settings: true }
  });

  const customerCode = tenant.settings?.paystackCustomerCode;
  console.log(`[DR] Created tenant ${tenant.id} with status PENDING`);

  // 2. Simulate Webhook 1: Subscription Created (Trial)
  const webhook1 = {
    event: "subscription.create",
    data: {
      reference: `sub_create_${Date.now()}`,
      status: "active", // Active means trial or paid in Paystack
      customer: { customer_code: customerCode },
      amount: 500000,
      next_payment_date: new Date(Date.now() + 14 * 86400000).toISOString(),
      metadata: { tenantId: tenant.id, targetPlan: "STARTER" }
    }
  };

  await simulateWebhook(webhook1);

  // Validate state
  let updated = await prisma.tenant.findUnique({ where: { id: tenant.id } });
  console.log(`[DR] State after sub.create: ${updated?.billingStatus}`);

  // 3. Simulate Webhook 2: Payment Failed
  const webhook2 = {
    event: "charge.success", // Oops, failure
    data: {
      reference: `charge_fail_${Date.now()}`,
      status: "failed",
      customer: { customer_code: customerCode },
      metadata: { tenantId: tenant.id, targetPlan: "STARTER" }
    }
  };
  webhook2.event = "charge.failed";

  await simulateWebhook(webhook2);

  updated = await prisma.tenant.findUnique({ where: { id: tenant.id } });
  console.log(`[DR] State after charge.failed: ${updated?.billingStatus}`);

  // 4. Simulate Webhook 3: Successful Payment
  const webhook3 = {
    event: "charge.success",
    data: {
      reference: `charge_success_${Date.now()}`,
      status: "success",
      amount: 500000,
      customer: { customer_code: customerCode },
      next_payment_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      metadata: { tenantId: tenant.id, targetPlan: "STARTER" }
    }
  };

  await simulateWebhook(webhook3);

  updated = await prisma.tenant.findUnique({ where: { id: tenant.id } });
  console.log(`[DR] State after charge.success: ${updated?.billingStatus} (Ends: ${updated?.billingEndsAt})`);

  console.log("[DR] Disaster Recovery Simulation Complete.");
  
  // Cleanup
  await prisma.saaSInvoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.billingEvent.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenantSettings.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenant.delete({ where: { id: tenant.id } });
  console.log("[DR] Cleaned up test tenant.");
}

runDisasterRecovery().catch(console.error);
