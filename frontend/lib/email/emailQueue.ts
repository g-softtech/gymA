import { prisma } from "@/lib/prisma";
import { waitUntil } from "@vercel/functions";
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

    // Poke the worker to process immediately (improves UX for magic links).
    // Uses waitUntil to guarantee execution completes without blocking the response.
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    waitUntil(
      fetch(`${appUrl}/api/workers/email-worker`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }).catch(() => {})
    );
    
  } catch (err: any) {
    // Log but never throw — email queuing must never break business logic
    console.error("[EmailQueue] Failed to enqueue email:", err.message);
  }
}
