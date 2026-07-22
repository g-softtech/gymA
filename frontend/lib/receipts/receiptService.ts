import { generateReceiptNumber } from "./receiptNumber";
import { generateReceiptHtml } from "./receiptTemplate";
import { sendEmail } from "@/lib/email/emailService";
import { prisma } from "@/lib/prisma";

export async function processAndSendReceipt({
  transactionId,
  tenantId,
  tenantName,
  tenantEmail,
  memberId,
  memberName,
  memberEmail,
  planName,
  amount,
  currency,
  paymentDate,
  subscriptionStart,
  subscriptionEnd,
  transactionReference,
}: {
  transactionId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  planName: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  transactionReference: string;
}) {
  try {
    // 1. Check if receipt exists
    let receipt = await prisma.receipt.findUnique({
      where: { transactionId },
    });

    if (receipt) {
      if (receipt.status === "SENT") {
        console.log(`[ReceiptService] Receipt already SENT for transaction ${transactionId}.`);
        return;
      }
      if (receipt.status === "PROCESSING") {
        console.log(`[ReceiptService] Receipt currently PROCESSING for transaction ${transactionId}.`);
        return;
      }
      // If FAILED, we will retry with the existing receipt number
    }

    let receiptNumber = receipt?.receiptNumber;

    if (!receipt) {
      // 2. Generate unique receipt number
      receiptNumber = await generateReceiptNumber(tenantId);

      // 3. Set PROCESSING state to lock this receipt
      try {
        receipt = await prisma.receipt.create({
          data: {
            transactionId,
            receiptNumber,
            tenantId,
            memberId,
            status: "PROCESSING",
          },
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          console.log(`[ReceiptService] Race condition prevented: Receipt just created for transaction ${transactionId}.`);
          return;
        }
        throw err;
      }
    } else {
      // Update to PROCESSING for retry
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: "PROCESSING" },
      });
    }

    if (!receiptNumber) throw new Error("Failed to resolve receipt number");

    // 4. Format values
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
    }).format(amount);

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    // 3. Generate HTML
    const html = generateReceiptHtml({
      gymName: tenantName || "CortexFit Gym",
      receiptNumber,
      transactionReference,
      memberName,
      memberEmail,
      planName,
      amountFormatted,
      paymentDate: formatDate(paymentDate),
      subscriptionStart: formatDate(subscriptionStart),
      subscriptionEnd: formatDate(subscriptionEnd),
      tenantEmail: tenantEmail || "support@cortexfit.com",
    });

    // 4. Send Email
    const subject = `Payment Receipt - ${receiptNumber}`;
    const emailResult = await sendEmail({
      to: memberEmail,
      subject,
      html,
      replyTo: tenantEmail || undefined,
    });

    // 6. Update to SENT or FAILED
    await prisma.receipt.update({
      where: { id: receipt!.id },
      data: {
        sentAt: emailResult.success ? new Date() : null,
        status: emailResult.success ? "SENT" : "FAILED",
        metadata: { emailError: emailResult.error },
      },
    });

    console.log(`[ReceiptService] Processed receipt ${receiptNumber} for transaction ${transactionId}`);
  } catch (error) {
    console.error("[ReceiptService] Critical error processing receipt:", error);
    // We intentionally don't throw to prevent rolling back the payment or crashing the webhook.
  }
}
