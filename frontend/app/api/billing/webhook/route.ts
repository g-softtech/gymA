import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { handlePaystackWebhook } from "@/lib/billing/handler";

const secret = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature || !secret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    // 1. Verify Signature using HMAC SHA512
    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    if (hash !== signature) {
      console.error("⚠️ Invalid Paystack Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const tenantId = payload.data?.metadata?.tenantId || payload.data?.customer?.metadata?.tenantId;

    // 2. Idempotency Check
    const eventId = crypto.createHash("sha256").update(rawBody).digest("hex");
    
    // We only enforce idempotency if we can tie it to a tenant to prevent 
    // blocking global events, but ideally we just store all events.
    if (tenantId) {
      const existingEvent = await prisma.billingEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent) {
        console.log(`[PAYSTACK] Event ${eventId} already processed. Ignoring.`);
        return NextResponse.json({ received: true }); // Idempotent 200 OK
      }

      await prisma.billingEvent.create({
        data: {
          eventId,
          tenantId,
          eventType: payload.event,
          payload: payload,
        },
      });
    }

    // 3. Delegate to Handler
    await handlePaystackWebhook(payload);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[WEBHOOK ERROR]", error.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
