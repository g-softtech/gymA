import { prisma } from "@/lib/prisma";
import type { EmailQueueEntry } from "./types";

/**
 * Enqueue an email for asynchronous delivery.
 *
 * This is the ONLY method business logic should call.
 * It writes to the EmailJob queue and returns immediately.
 * The worker picks it up and sends it.
 */
export async function enqueueEmail(entry: EmailQueueEntry): Promise<void> {
  try {
    await prisma.emailJob.create({
      data: {
        eventId: entry.eventId,
        emailType: entry.emailType as any, // Prisma enum cast
        recipient: entry.recipient,
        subject: entry.subject,
        payload: entry.payload as any,
        tenantId: entry.tenantId,
        userId: entry.userId,
        status: "PENDING",
        nextRetryAt: new Date(), // Ready to process immediately
      },
    });
  } catch (err: any) {
    // Log but never throw — email queuing must never break business logic
    console.error("[EmailQueue] Failed to enqueue email:", err.message);
  }
}
