import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { processAndSendReceipt } from "./receipts/receiptService";

/**
 * Fulfills a payment idempotently. 
 * Can be called safely by both the webhook and the client-verification route.
 * 
 * @param reference The Paystack transaction reference
 * @param gatewayData Additional data from Paystack (amount, currency, raw response)
 */
export async function fulfillPayment(reference: string, gatewayData: {
  amountKobo: number;
  currency: string;
  rawResponse: any;
}) {
  // 1. Fetch the transaction
  const transaction = await prisma.transaction.findUnique({
    where: { reference },
  });

  if (!transaction) {
    throw new Error(`Transaction not found for reference: ${reference}`);
  }

  if (transaction.status === "SUCCESS") {
    console.log(`[fulfillPayment] Transaction ${reference} already SUCCESS (idempotent).`);
    return { success: true, alreadyFulfilled: true };
  }

  if (transaction.status !== "PENDING") {
    throw new Error(`Transaction ${reference} has invalid status for fulfillment: ${transaction.status}`);
  }

  // 2. Validate Currency and Amount
  if (transaction.currency !== gatewayData.currency) {
    throw new Error(`Currency mismatch for ${reference}. Expected ${transaction.currency}, got ${gatewayData.currency}`);
  }

  const expectedKobo = Math.round(Number(transaction.amount) * 100);
  if (expectedKobo !== gatewayData.amountKobo) {
    throw new Error(`Amount mismatch for ${reference}. Expected ${expectedKobo} kobo, got ${gatewayData.amountKobo} kobo`);
  }

  // 3. Fulfill based on itemType
  if (transaction.itemType === "MEMBERSHIP") {
    const metadata = transaction.metadata as any;
    const planId = metadata?.planId;
    if (!planId) throw new Error("Missing planId in transaction metadata");

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new Error("Membership plan not found");

    // Execute atomic transaction
    try {
      const fulfillmentStatus = await prisma.$transaction(async (tx) => {
        // a. Mark transaction SUCCESS ATOMICALLY
        const updateResult = await tx.transaction.updateMany({
          where: { id: transaction.id, status: "PENDING" },
          data: {
            status: "SUCCESS",
            metadata: {
              ...metadata,
              gatewayResponse: gatewayData.rawResponse,
              fulfilledAt: new Date().toISOString(),
            },
          },
        });

        // If count is 0, another concurrent request already updated it to SUCCESS
        if (updateResult.count === 0) {
          return { alreadyFulfilled: true };
        }

      // b. Ensure member profile exists
      let memberProfile = await tx.memberProfile.findUnique({
        where: { userId: transaction.memberId },
      });

      if (!memberProfile) {
        memberProfile = await tx.memberProfile.create({
          data: { userId: transaction.memberId, fitnessGoals: [] },
        });
      }

      const user = await tx.user.findUnique({
        where: { id: transaction.memberId },
      });

      // c. Find existing active subscription
      const currentActiveSub = await tx.subscription.findFirst({
        where: {
          memberId: memberProfile.id,
          tenantId: transaction.tenantId,
          status: "ACTIVE",
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: "desc" },
      });

      let startDate = new Date();
      let endDate = new Date();

      if (currentActiveSub) {
        // Is it a renewal or an upgrade? 
        // If it's the exact same plan, it's a renewal. We extend the end date.
        if (currentActiveSub.planId === plan.id) {
          startDate = new Date(currentActiveSub.endDate);
        } else {
          // It's an upgrade or lateral move mid-cycle. 
          // Start immediately, no proration (fresh cycle).
          startDate = new Date();
        }

        // Mark the old subscription as REPLACED to preserve history safely.
        await tx.subscription.update({
          where: { id: currentActiveSub.id },
          data: { status: "REPLACED" },
        });
      }

      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.durationDays);

      // d. Create NEW Subscription 
      await tx.subscription.create({
        data: {
          memberId: memberProfile.id,
          planId: plan.id,
          tenantId: transaction.tenantId,
          startDate,
          endDate,
          status: "ACTIVE",
          paymentGatewayId: reference,
        },
      });

        // e. Create Notification
        await tx.notification.create({
          data: {
            tenantId: transaction.tenantId,
            userId: transaction.memberId,
            type: "PAYMENT",
            title: currentActiveSub?.planId === plan.id ? "Subscription Renewed 🎉" : "Subscription Upgraded 🎉",
            message: `Your ${plan.name} membership is now active until ${endDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.`,
          },
        });

        return { alreadyFulfilled: false, subscriptionStart: startDate, subscriptionEnd: endDate, memberName: user?.name, memberEmail: user?.email };
      });

      if (fulfillmentStatus.alreadyFulfilled) {
        console.log(`[fulfillPayment] Race condition prevented. Transaction ${reference} was claimed by another request.`);
        return { success: true, alreadyFulfilled: true };
      }

      // --- OUTSIDE TRANSACTION: RECEIPT GENERATION ---
      if (fulfillmentStatus.subscriptionStart && fulfillmentStatus.subscriptionEnd) {
        // Double check idempotency via Receipt table
        const existingReceipt = await prisma.receipt.findUnique({
          where: { transactionId: transaction.id },
        });

        if (!existingReceipt) {
          const tenant = await prisma.tenant.findUnique({ where: { id: transaction.tenantId }});
          
          await processAndSendReceipt({
            transactionId: transaction.id,
            tenantId: transaction.tenantId,
            tenantName: tenant?.name || "CortexFit Gym",
            tenantEmail: "support@cortexfit.com",
            memberId: transaction.memberId,
            memberName: fulfillmentStatus.memberName || "Member",
            memberEmail: fulfillmentStatus.memberEmail || "",
            planName: plan.name,
            amount: Number(transaction.amount),
            currency: transaction.currency,
            paymentDate: new Date(),
            subscriptionStart: fulfillmentStatus.subscriptionStart,
            subscriptionEnd: fulfillmentStatus.subscriptionEnd,
            transactionReference: reference,
          });
        }
      }

    } catch (error) {
      // Handle Prisma unique constraint violation gracefully
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        console.warn(`[fulfillPayment] Unique constraint violation on subscription creation for reference ${reference}. Treating as already fulfilled.`);
        return { success: true, alreadyFulfilled: true };
      }
      throw error;
    }

    console.log(`[fulfillPayment] ✅ Successfully fulfilled membership transaction ${reference}`);
    return { success: true, alreadyFulfilled: false };
  } else {
    // Handling for CLASS_BOOKING / TRAINER_SESSION if they existed
    console.warn(`[fulfillPayment] itemType ${transaction.itemType} fulfillment logic not fully implemented in this module yet.`);
    
    // Mark as success at least
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "SUCCESS" }
    });
    return { success: true, alreadyFulfilled: false };
  }
}
