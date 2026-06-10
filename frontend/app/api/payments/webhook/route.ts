import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payments/webhook
 *
 * Paystack server-to-server webhook handler.
 *
 * This is the RELIABLE path for subscription activation. The client-side
 * /api/payments/verify is a convenience fast-path, but this webhook is the
 * source of truth — it fires even if the member closes their browser
 * immediately after payment.
 *
 * Paystack retries failed webhooks (non-200) up to 5 times with exponential
 * backoff, so this handler must be idempotent.
 *
 * Required env var: PAYSTACK_SECRET_KEY
 *
 * Metadata expected on the Paystack transaction (set in CheckoutButton.tsx):
 *   metadata.custom_fields:
 *     - plan_id   → MembershipPlan.id
 *     - user_id   → User.id (the paying member)
 */
export async function POST(req: NextRequest) {
  // ── 1. Read raw body (needed for HMAC signature verification) ─────────────
  const rawBody = await req.text();

  // ── 2. Verify Paystack HMAC-SHA512 signature ──────────────────────────────
  const signature = req.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error("[webhook] PAYSTACK_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.warn("[webhook] Invalid Paystack signature — request rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 3. Parse event ─────────────────────────────────────────────────────────
  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 4. Handle charge.success ───────────────────────────────────────────────
  if (event.event === "charge.success") {
    try {
      await handleChargeSuccess(event.data);
    } catch (err) {
      // Log the error but still return 200 so Paystack doesn't retry
      // indefinitely for unrecoverable errors (e.g., plan deleted).
      console.error("[webhook] charge.success handler error:", err);
    }
  }

  // ── 5. Always respond 200 quickly so Paystack doesn't retry unnecessarily ──
  return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: charge.success
// ─────────────────────────────────────────────────────────────────────────────

async function handleChargeSuccess(data: PaystackChargeData) {
  const { reference, customer, metadata } = data;

  console.log(`[webhook] charge.success — reference: ${reference}`);

  // ── Extract planId and userId from Paystack metadata custom_fields ─────────
  const customFields = metadata?.custom_fields ?? [];
  const planId = customFields.find((f) => f.variable_name === "plan_id")?.value;
  const userId = customFields.find((f) => f.variable_name === "user_id")?.value;

  if (!planId) {
    console.warn(`[webhook] No plan_id in metadata for reference ${reference} — cannot activate subscription`);
    return;
  }

  // ── Look up the membership plan to get tenantId and duration ──────────────
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    select: { id: true, tenantId: true, durationDays: true, name: true },
  });

  if (!plan) {
    console.warn(`[webhook] MembershipPlan ${planId} not found — skipping`);
    return;
  }

  // ── Resolve User from userId (preferred) or customer email (fallback) ──────
  let user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  if (!user && customer?.email) {
    user = await prisma.user.findUnique({ where: { email: customer.email } });
  }

  if (!user) {
    console.warn(`[webhook] Could not resolve user for reference ${reference} — email: ${customer?.email}`);
    return;
  }

  // ── Ensure MemberProfile exists ────────────────────────────────────────────
  let memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });

  if (!memberProfile) {
    memberProfile = await prisma.memberProfile.create({
      data: { userId: user.id, fitnessGoals: [] },
    });
    console.log(`[webhook] Created MemberProfile for user ${user.id}`);
  }

  // ── Idempotency check: don't create duplicate subscription ────────────────
  const existingSubscription = await prisma.subscription.findFirst({
    where: { paymentGatewayId: reference },
  });

  if (existingSubscription) {
    console.log(`[webhook] Subscription for reference ${reference} already exists — skipping duplicate`);
    return;
  }

  // ── Create Subscription ────────────────────────────────────────────────────
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  await prisma.subscription.create({
    data: {
      memberId: memberProfile.id,
      planId: plan.id,
      tenantId: plan.tenantId,
      startDate,
      endDate,
      status: "ACTIVE",
      paymentGatewayId: reference,
    },
  });

  // ── Create welcome notification ────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      tenantId: plan.tenantId,
      userId: user.id,
      type: "PAYMENT",
      title: "Subscription Activated 🎉",
      message: `Your ${plan.name} membership is now active until ${endDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.`,
    },
  });

  console.log(`[webhook] ✅ Subscription created for user ${user.id} — plan: ${plan.name}, ref: ${reference}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Paystack webhook types
// ─────────────────────────────────────────────────────────────────────────────

interface PaystackCustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

interface PaystackMetadata {
  custom_fields?: PaystackCustomField[];
  [key: string]: unknown;
}

interface PaystackChargeData {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    customer_code?: string;
    first_name?: string;
    last_name?: string;
  };
  metadata?: PaystackMetadata;
}

interface PaystackWebhookEvent {
  event: string;
  data: PaystackChargeData;
}
