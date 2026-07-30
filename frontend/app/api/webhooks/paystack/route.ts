import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/paystack";

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

    // 1. Idempotency Check using `${eventType}:${reference}`
    const eventKey = `${eventType}:${reference || "none"}`;
    
    try {
      await prisma.paymentEvent.create({
        data: {
          eventKey,
          reference,
          eventType,
          payload
        }
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        // Unique constraint violation -> Event already processed
        return NextResponse.json({ message: "Event already processed" });
      }
      throw err;
    }

    // 2. Transaction processing
    if (eventType === "charge.success" && reference) {
      await processChargeSuccess(reference, payload);
    } else if (eventType === "refund.processed" && reference) {
      await processRefund(reference, payload.amount);
    }

    // Mark event as processed
    await prisma.paymentEvent.update({
      where: { eventKey },
      data: { processed: true, processedAt: new Date() }
    });

    return NextResponse.json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function processChargeSuccess(reference: string, payload: any) {
  await prisma.$transaction(async (tx) => {
    // 1. SaaS Platform Subscription Fulfillment
    if (reference.startsWith("PLATFORM_")) {
      const invoice = await tx.saaSInvoice.findUnique({ where: { reference } });
      if (!invoice || invoice.status === "paid") return;

      const metadata = payload.metadata || {};
      const expectedAmountKobo = Math.round(Number(invoice.amount) * 100);

      // Webhook Hardening: Verify amount matches exactly
      if (payload.amount !== expectedAmountKobo) {
        throw new Error(`Amount mismatch. Expected ${expectedAmountKobo}, got ${payload.amount}`);
      }
      
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      // Generate Sequential Invoice Number
      const year = new Date().getFullYear();
      const lastInvoice = await tx.saaSInvoice.findFirst({
        where: { invoiceNumber: { startsWith: `CF-${year}-` } },
        orderBy: { invoiceNumber: 'desc' }
      });
      let nextSeq = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const parts = lastInvoice.invoiceNumber.split('-');
        nextSeq = parseInt(parts[2], 10) + 1;
      }
      const invoiceNumber = `CF-${year}-${nextSeq.toString().padStart(6, '0')}`;

      // Atomic Upgrade
      await tx.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          plan: metadata.planCode,
          planVersion: "v1",
          planStartedAt: new Date(),
          billingEndsAt: nextYear
        }
      });

      // Immutable Invoice Update
      await tx.saaSInvoice.update({
        where: { id: invoice.id },
        data: { status: "paid", invoiceNumber }
      });

      // Permanent Subscription Record
      await tx.tenantSubscription.create({
        data: {
          tenantId: invoice.tenantId,
          plan: metadata.planCode,
          planVersion: "v1",
          pricePaid: invoice.amount,
          currency: invoice.currency,
          billingCycle: invoice.billingPeriod || "YEARLY",
          startedAt: new Date(),
          expiresAt: nextYear
        }
      });

      // Emit Domain Event (could be abstracted to an event bus)
      await tx.billingEvent.create({
        data: {
          tenantId: invoice.tenantId,
          eventId: `sub_activated_${reference}`,
          eventType: "SUBSCRIPTION_ACTIVATED",
          payload: { plan: metadata.planCode, amount: invoice.amount }
        }
      });
      return;
    }

    // 2. Gym Member Transaction Fulfillment
    const transaction = await tx.transaction.findUnique({
      where: { reference },
      include: { tenant: true, member: true }
    });

    if (!transaction || transaction.status === "SUCCESS") return;

    // Mark Transaction Success
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "SUCCESS" }
    });

    const metadata: any = transaction.metadata || {};

    if (transaction.itemType === "MEMBERSHIP") {
      const { planId, durationDays } = metadata;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (durationDays || 30));

      // Upsert Subscription
      const existingSub = await tx.subscription.findFirst({
        where: { memberId: transaction.memberId, tenantId: transaction.tenantId, planId }
      });

      if (existingSub) {
        await tx.subscription.update({
          where: { id: existingSub.id },
          data: { status: "ACTIVE", startDate, endDate }
        });
      } else {
        await tx.subscription.create({
          data: {
            tenantId: transaction.tenantId,
            memberId: transaction.memberId,
            planId,
            status: "ACTIVE",
            startDate,
            endDate
          }
        });
      }
    } 
    else if (transaction.itemType === "CLASS_BOOKING" || transaction.itemType === "TRAINER_SESSION") {
      const { bookingId } = metadata;
      if (bookingId) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { 
            paymentStatus: "SUCCESS",
            status: "CONFIRMED" // Activate the booking
          }
        });
      }
    }
  });
}

async function processRefund(reference: string, refundedAmountKobo: number) {
  await prisma.$transaction(async (tx) => {
    // 1. Mark transaction state as refunded
    const transaction = await tx.transaction.update({
      where: { reference },
      data: { status: "REFUNDED", refundedAmount: refundedAmountKobo / 100 }
    });

    // 2. Cascade revocation to prevent access leak
    if (transaction.itemType === "MEMBERSHIP") {
      await tx.subscription.updateMany({
        where: { 
          memberId: transaction.memberId, 
          tenantId: transaction.tenantId,
          status: "ACTIVE" 
        },
        data: { status: "CANCELLED" }
      });
    }
  });
}
