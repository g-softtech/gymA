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
      await processChargeSuccess(reference);
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

async function processChargeSuccess(reference: string) {
  await prisma.$transaction(async (tx) => {
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
