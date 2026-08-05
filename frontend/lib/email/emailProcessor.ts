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
// INTERNAL — Worker Entry Point
// =============================================================================

/**
 * Processes a single pending EmailJob.
 * Called by the email worker at /api/workers/email-worker/route.ts
 * Guarantees exactly-once delivery via idempotency check before sending.
 */
export async function processEmailJob(job: any): Promise<void> {
  const jobId = job.id;

  // ── Idempotency Check ───────────────────────────────────────────────────────
  // Only deduplicate by eventId (a stable business event ID).
  // Do NOT deduplicate by recipient + emailType alone — magic links are
  // unique per request and must never be blocked by a previous send.
  const alreadySent = job.eventId
    ? await prisma.emailLog.findFirst({
        where: { eventId: job.eventId, status: "SENT" },
      })
    : null;

  if (alreadySent) {
    console.warn(`[EmailService] Idempotency check: Job ${jobId} (Event ${job.eventId}) already sent. Skipping.`);
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
        eventId: job.eventId,
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
  const isDemoMode = process.env.DEMO_MODE === "true" || (job.tenantId && await prisma.tenant.findUnique({ where: { id: job.tenantId } }).then(t => t?.isDemo));

  try {
    if (isDemoMode) {
      console.log(`[EmailService] DEMO MODE: Suppressing email to ${job.recipient}`);
      providerMessageId = `demo_suppressed_${Date.now()}`;
    } else {
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
    }
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
          eventId: job.eventId,
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
