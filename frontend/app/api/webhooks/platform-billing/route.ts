import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/paystack";
import { TenantPlan } from "@prisma/client";
import crypto from "crypto";

export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !verifyPaystackSignature(rawBody, signature)) {
      console.error(`[platform-billing][${correlationId}] Invalid Paystack webhook signature — rejected`);
      // Return 401 (not 400) — Paystack will not retry on 4xx that are not 429
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventData = JSON.parse(rawBody);
    const eventType = eventData.event;
    const payload = eventData.data;
    const reference = payload.reference;
    console.log(`[platform-billing][${correlationId}] Received event=${eventType} reference=${reference}`);

    // 1. Resolve tenantId
    let tenantId = payload.metadata?.tenantId;
    if (!tenantId && payload.customer?.customer_code) {
      const settings = await prisma.tenantSettings.findFirst({
        where: { paystackCustomerCode: payload.customer.customer_code }
      });
      if (settings) {
        tenantId = settings.tenantId;
      }
    }
    
    // Fallback to a placeholder if we couldn't resolve it
    tenantId = tenantId || "UNKNOWN";

    // 2. Idempotency Check — key is based on stable provider identifiers ONLY.
    // correlationId is per-request and must NOT be part of this key, otherwise
    // Paystack retries of the same event will bypass replay protection.
    const eventKey = `platform:${eventType}:${reference || "none"}`;

    try {
      await prisma.billingEvent.create({
        data: {
          tenantId,
          eventId: eventKey,
          eventType,
          // correlationId stored in payload for tracing — not part of the dedup key
          payload: { ...payload, correlationId },
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        console.log(`[platform-billing][${correlationId}] Duplicate event detected (${eventKey}) — skipping`);
        return NextResponse.json({ message: "Event already processed" });
      }
      throw err;
    }


    // 2. Event Routing
    if (eventType === "charge.success" || eventType === "subscription.create") {
      await handleSubscriptionSuccess(payload);
    } else if (eventType === "invoice.payment_failed" || eventType === "subscription.not_renewed") {
      await handleSubscriptionFailed(payload);
    } else if (eventType === "subscription.disable") {
      await handleSubscriptionDisabled(payload);
    }

    return NextResponse.json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("Platform Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handleSubscriptionSuccess(payload: any) {
  const metadata = payload.metadata || {};
  const tenantId = metadata.tenantId;
  const targetPlan = (metadata.targetPlan || metadata.planCode) as TenantPlan;

  if (!tenantId || !targetPlan) return;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return;
  const billingStatusBefore = tenant.billingStatus;

  // Extend billing by 30 days from next_payment_date or existing billingEndsAt
  const currentEndDate = tenant.billingEndsAt && tenant.billingEndsAt.getTime() > Date.now() 
    ? tenant.billingEndsAt.getTime() 
    : Date.now();

  const nextPaymentDate = payload.next_payment_date
    ? new Date(payload.next_payment_date)
    : new Date(currentEndDate + 30 * 24 * 60 * 60 * 1000);

  const correlationId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    // Update authoritative billing fields on Tenant
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        plan: targetPlan,
        billingStatus: "ACTIVE",
        billingEndsAt: nextPaymentDate,
      },
    });

    await tx.tenantSettings.upsert({
      where: { tenantId },
      update: {
        subscriptionPlan: targetPlan,
        subscriptionStatus: "active",
        paystackCustomerCode: payload.customer?.customer_code || null,
        paystackSubscriptionCode: payload.subscription_code || null,
        currentPeriodEnd: nextPaymentDate,
      },
      create: {
        tenantId,
        subscriptionPlan: targetPlan,
        subscriptionStatus: "active",
        paystackCustomerCode: payload.customer?.customer_code || null,
        paystackSubscriptionCode: payload.subscription_code || null,
        currentPeriodEnd: nextPaymentDate,
      },
    });

    if (payload.amount) {
      await tx.saaSInvoice.create({
        data: {
          tenantId,
          amount: payload.amount / 100,
          status: "paid",
          reference: payload.reference || `sub_${Date.now()}`,
        },
      });
    }

    await tx.billingEvent.create({
      data: {
        tenantId,
        eventId: correlationId,
        eventType: "PAYMENT_SUCCESS",
        payload: {
          timestamp: new Date().toISOString(),
          tenantId,
          billingStatusBefore,
          billingStatusAfter: "ACTIVE",
          eventType: "PAYMENT_SUCCESS",
          correlationId,
          providerReference: payload.reference,
          workerId: "platform-billing-webhook",
        },
      },
    });
  });

  // Post-commit emission only
  const { subscriptionEventBus } = await import("@/lib/events/subscriptionEventBus");
  subscriptionEventBus.emit("SUBSCRIPTION_REACTIVATED", { tenantId });
}

async function handleSubscriptionFailed(payload: any) {
  const metadata = payload.metadata || {};
  // Sometimes Paystack drops metadata on subscription hooks. 
  // We can lookup by customer_code or subscription_code if needed.
  let tenantId = metadata.tenantId;

  if (!tenantId && payload.customer?.customer_code) {
    const settings = await prisma.tenantSettings.findFirst({
      where: { paystackCustomerCode: payload.customer.customer_code }
    });
    if (settings) {
      tenantId = settings.tenantId;
    }
  }

  if (!tenantId) return;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return;
  const billingStatusBefore = tenant.billingStatus;
  const correlationId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: { plan: "STARTER", billingStatus: "PAST_DUE" },
    });

    await tx.tenantSettings.update({
      where: { tenantId },
      data: { subscriptionPlan: "STARTER", subscriptionStatus: "past_due" },
    });

    await tx.billingEvent.create({
      data: {
        tenantId,
        eventId: correlationId,
        eventType: "PAYMENT_FAILED",
        payload: {
          timestamp: new Date().toISOString(),
          tenantId,
          billingStatusBefore,
          billingStatusAfter: "PAST_DUE",
          eventType: "PAYMENT_FAILED",
          correlationId,
          providerReference: payload.reference,
          workerId: "platform-billing-webhook",
        },
      },
    });
  });
}

async function handleSubscriptionDisabled(payload: any) {
  const customerCode = payload.customer?.customer_code;
  if (!customerCode) return;

  const settings = await prisma.tenantSettings.findFirst({
    where: { paystackCustomerCode: customerCode },
  });
  if (!settings) return;

  const tenant = await prisma.tenant.findUnique({ where: { id: settings.tenantId } });
  if (!tenant) return;
  const billingStatusBefore = tenant.billingStatus;
  const correlationId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: settings.tenantId },
      data: { billingStatus: "SUSPENDED" },
    });

    await tx.tenantSettings.update({
      where: { tenantId: settings.tenantId },
      data: { subscriptionStatus: "canceled" },
    });

    await tx.billingEvent.create({
      data: {
        tenantId: settings.tenantId,
        eventId: correlationId,
        eventType: "SUBSCRIPTION_DISABLED",
        payload: {
          timestamp: new Date().toISOString(),
          tenantId: settings.tenantId,
          billingStatusBefore,
          billingStatusAfter: "SUSPENDED",
          eventType: "SUBSCRIPTION_DISABLED",
          correlationId,
          workerId: "platform-billing-webhook",
        },
      },
    });
  });

  // Post-commit emission
  const { subscriptionEventBus } = await import("@/lib/events/subscriptionEventBus");
  subscriptionEventBus.emit("SUBSCRIPTION_SUSPENDED", { tenantId: settings.tenantId });
}
