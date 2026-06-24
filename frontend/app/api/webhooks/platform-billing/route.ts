import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/paystack";
import { TenantPlan } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !verifyPaystackSignature(rawBody, signature)) {
      console.error("Invalid Paystack webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventData = JSON.parse(rawBody);
    const eventType = eventData.event;
    const payload = eventData.data;
    const reference = payload.reference;

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

    // 2. Idempotency Check using `${eventType}:${reference}`
    const eventKey = `platform:${eventType}:${reference || "none"}`;
    
    try {
      await prisma.billingEvent.create({
        data: {
          tenantId,
          eventId: eventKey,
          eventType,
          payload
        }
      });
    } catch (err: any) {
      if (err.code === "P2002") {
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
  const targetPlan = metadata.targetPlan as TenantPlan;

  if (!tenantId || !targetPlan) return;

  await prisma.$transaction(async (tx) => {
    // Update Tenant Plan
    await tx.tenant.update({
      where: { id: tenantId },
      data: { plan: targetPlan }
    });

    // Update Tenant Settings
    await tx.tenantSettings.upsert({
      where: { tenantId },
      update: {
        subscriptionPlan: targetPlan,
        subscriptionStatus: "active",
        paystackCustomerCode: payload.customer?.customer_code || null,
        paystackSubscriptionCode: payload.subscription_code || null,
        currentPeriodEnd: payload.next_payment_date ? new Date(payload.next_payment_date) : null
      },
      create: {
        tenantId,
        subscriptionPlan: targetPlan,
        subscriptionStatus: "active",
        paystackCustomerCode: payload.customer?.customer_code || null,
        paystackSubscriptionCode: payload.subscription_code || null,
        currentPeriodEnd: payload.next_payment_date ? new Date(payload.next_payment_date) : null
      }
    });

    // We can also create a SaaSInvoice record if we want to log the transaction
    if (payload.amount) {
      await tx.saaSInvoice.create({
        data: {
          tenantId,
          amount: payload.amount / 100,
          status: "paid",
          reference: payload.reference || `sub_${Date.now()}`
        }
      });
    }
  });
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

  await prisma.$transaction(async (tx) => {
    // Downgrade to STARTER gracefully
    await tx.tenant.update({
      where: { id: tenantId },
      data: { plan: "STARTER" }
    });

    await tx.tenantSettings.update({
      where: { tenantId },
      data: {
        subscriptionPlan: "STARTER",
        subscriptionStatus: "past_due"
      }
    });
  });
}

async function handleSubscriptionDisabled(payload: any) {
  // Voluntary cancellation - they keep access until end of billing cycle
  // We just mark it as canceled
  const customerCode = payload.customer?.customer_code;
  if (!customerCode) return;

  const settings = await prisma.tenantSettings.findFirst({
    where: { paystackCustomerCode: customerCode }
  });

  if (!settings) return;

  await prisma.tenantSettings.update({
    where: { tenantId: settings.tenantId },
    data: {
      subscriptionStatus: "canceled"
    }
  });
}
