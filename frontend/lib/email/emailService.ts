// =============================================================================
// CORTEXFIT EMAIL ENGINE — EMAIL SERVICE (UPGRADED)
// Replaces the original lib/email/emailService.ts.
//
// Responsibilities:
//   1. enqueueEmail() — writes an EmailJob to the database (never blocks business logic)
//   2. processEmailJob() — called by the worker to render + send + log
//   3. processIdempotent() — checks if already sent before attempting delivery
// =============================================================================

import { prisma } from "@/lib/prisma";
import { renderEmail } from "./emailRenderer";
import { CORTEXFIT_BRAND } from "./types";
import type { EmailQueueEntry, BrandContext, EmailType } from "./types";

// ── Retry Policy ──────────────────────────────────────────────────────────────
// Attempt 1 → 30s → Attempt 2 → 5min → Attempt 3 → 30min → Attempt 4 → FAILED

const RETRY_DELAYS_MS = [
  30 * 1000,           // 30 seconds
  5 * 60 * 1000,       // 5 minutes
  30 * 60 * 1000,      // 30 minutes
];

const MAX_ATTEMPTS = 4;

// ── Template Version ──────────────────────────────────────────────────────────
const TEMPLATE_VERSION = "v1";

// =============================================================================
// PUBLIC API — Business Logic Entry Point
// =============================================================================

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
    console.error("[EmailService] Failed to enqueue email:", err.message);
  }
}

// =============================================================================
// INTERNAL — Worker Entry Point
// =============================================================================

/**
 * Processes a single pending EmailJob.
 * Called by the email worker at /api/workers/email-worker/route.ts
 * Guarantees exactly-once delivery via idempotency check before sending.
 */
export async function processEmailJob(jobId: string): Promise<void> {
  const job = await prisma.emailJob.findUnique({ where: { id: jobId } });

  if (!job) {
    console.warn(`[EmailService] Job ${jobId} not found.`);
    return;
  }

  if (job.status === "PROCESSING" || job.status === "SENT") {
    console.warn(`[EmailService] Job ${jobId} is already ${job.status}. Skipping.`);
    return;
  }

  // Mark as PROCESSING
  await prisma.emailJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      lastAttemptAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  // ── Idempotency Check ───────────────────────────────────────────────────────
  // Check if we've already successfully delivered this exact email to this recipient
  const alreadySent = await prisma.emailLog.findFirst({
    where: {
      emailType: job.emailType,
      recipient: job.recipient,
      tenantId: job.tenantId,
      status: "SENT",
    },
  });

  if (alreadySent) {
    console.log(`[EmailService] Idempotency: Email ${job.emailType} to ${job.recipient} already sent. Cleaning up job.`);
    await prisma.emailJob.delete({ where: { id: jobId } });
    return;
  }

  // ── Resolve Brand Context ───────────────────────────────────────────────────
  let brand: BrandContext = CORTEXFIT_BRAND;
  if (job.tenantId) {
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: job.tenantId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: job.tenantId } });
    if (settings && tenant) {
      brand = {
        brandName: tenant.name,
        logo: settings.logoUrl ?? undefined,
        primaryColor: settings.primaryColor ?? CORTEXFIT_BRAND.primaryColor,
        secondaryColor: settings.secondaryColor ?? undefined,
        supportEmail: settings.email ?? CORTEXFIT_BRAND.supportEmail,
        website: `https://cortexfit.vercel.app/gym/${tenant.slug}`,
        replyTo: settings.email ?? CORTEXFIT_BRAND.replyTo,
        footerText: `© ${new Date().getFullYear()} ${tenant.name}. Powered by CortexFit.`,
      };
    }
  }

  // ── Render Template ─────────────────────────────────────────────────────────
  let html: string;
  try {
    html = renderEmail(job.emailType as EmailType, job.payload as Record<string, unknown>, brand);
  } catch (renderErr: any) {
    console.error(`[EmailService] Render failed for job ${jobId}:`, renderErr.message);
    await prisma.emailJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED_RENDER",
        errorMessage: `RENDER: ${renderErr.message}`,
      },
    });
    await prisma.emailLog.create({
      data: {
        emailType: job.emailType as any,
        recipient: job.recipient,
        subject: job.subject,
        tenantId: job.tenantId,
        userId: job.userId,
        templateVersion: TEMPLATE_VERSION,
        status: "FAILED_RENDER",
        attempts: job.attempts + 1,
        errorMessage: `RENDER: ${renderErr.message}`,
      },
    });
    return;
  }

  // ── Send via Resend ─────────────────────────────────────────────────────────
  let providerMessageId: string | undefined;
  let sendError: string | undefined;

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${brand.brandName} <info@thecortexsystems.com>`,
        to: job.recipient,
        subject: job.subject,
        html,
        reply_to: brand.replyTo,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(JSON.stringify(responseData));
    }

    providerMessageId = responseData.id;
  } catch (sendErr: any) {
    sendError = sendErr.message;
  }

  const succeeded = !sendError;
  const currentAttempts = job.attempts + 1;

  if (succeeded) {
    // ── Success: Write audit log and delete the job ──────────────────────────
    await prisma.$transaction([
      prisma.emailLog.create({
        data: {
          emailType: job.emailType as any,
          recipient: job.recipient,
          subject: job.subject,
          tenantId: job.tenantId,
          userId: job.userId,
          templateVersion: TEMPLATE_VERSION,
          provider: "RESEND",
          providerMessageId,
          status: "SENT",
          attempts: currentAttempts,
          sentAt: new Date(),
        },
      }),
      prisma.emailJob.delete({ where: { id: jobId } }),
    ]);

    console.log(`[EmailService] ✅ Sent: ${job.emailType} → ${job.recipient} (${providerMessageId})`);
  } else {
    // ── Failure: Schedule retry or mark as permanently failed ────────────────
    const isFinal = currentAttempts >= MAX_ATTEMPTS;
    const delayMs = RETRY_DELAYS_MS[currentAttempts - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
    const nextRetryAt = isFinal ? null : new Date(Date.now() + delayMs);

    await prisma.emailJob.update({
      where: { id: jobId },
      data: {
        status: isFinal ? "FAILED" : "PENDING",
        errorMessage: sendError,
        nextRetryAt,
      },
    });

    if (isFinal) {
      await prisma.emailLog.create({
        data: {
          emailType: job.emailType as any,
          recipient: job.recipient,
          subject: job.subject,
          tenantId: job.tenantId,
          userId: job.userId,
          templateVersion: TEMPLATE_VERSION,
          provider: "RESEND",
          status: "FAILED",
          attempts: currentAttempts,
          errorMessage: sendError,
        },
      });
      console.error(`[EmailService] ❌ Permanently failed after ${currentAttempts} attempts: ${job.emailType} → ${job.recipient}`);
    } else {
      console.warn(`[EmailService] ⚠️ Attempt ${currentAttempts}/${MAX_ATTEMPTS} failed. Retrying at ${nextRetryAt?.toISOString()}: ${job.emailType} → ${job.recipient}`);
    }
  }
}
