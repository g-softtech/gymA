import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { fulfillPayment } from "@/lib/paymentFulfillment";
import { handlePaystackWebhook } from "@/lib/billing/handler";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payments/webhook
 *
 * Paystack server-to-server webhook handler.
 *
 * This is the RELIABLE path for subscription activation. The client-side
 * /api/payments/verify is a convenience fast-path, but this webhook is the
 * source of truth.
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
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 4. Handle charge.success ───────────────────────────────────────────────
  if (event.event === "charge.success") {
    try {
      const reference = event.data.reference;

      // Determine routing via DB lookup (source of truth)
      const saasInvoice = await prisma.saaSInvoice.findUnique({
        where: { reference },
      });

      if (saasInvoice) {
        console.log(`[webhook] Reference ${reference} matches SaaS invoice. Routing to Platform billing handler.`);
        await handlePaystackWebhook(event, saasInvoice);
      } else {
        const transaction = await prisma.transaction.findUnique({
          where: { reference },
        });

        if (transaction) {
          console.log(`[webhook] Reference ${reference} matches Transaction. Routing to Member billing handler.`);
          await fulfillPayment(reference, {
            amountKobo: event.data.amount,
            currency: event.data.currency,
            rawResponse: event.data,
          });
        } else {
          console.warn(`[webhook] Unrecognized reference: ${reference}. Ignoring event.`);
        }
      }
    } catch (err) {
      // Log the error but still return 200 so Paystack doesn't retry
      // indefinitely for unrecoverable errors (e.g., plan deleted or mismatched amount).
      console.error("[webhook] charge.success handler error:", err);
    }
  }

  // ── 5. Always respond 200 quickly so Paystack doesn't retry unnecessarily ──
  return NextResponse.json({ received: true });
}
