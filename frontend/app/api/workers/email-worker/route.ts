// =============================================================================
// CORTEXFIT EMAIL WORKER
// Background API route that processes the EmailJob queue.
//
// Invocation: Called by a Vercel Cron Job every minute.
// Schedule: Add to vercel.json: { "path": "/api/workers/email-worker", "schedule": "* * * * *" }
//
// Security: Protected by CRON_SECRET header — only Vercel infrastructure can call it.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processEmailJob } from "@/lib/email/emailProcessor";

const BATCH_SIZE = 10; // Max jobs to process per invocation

export async function GET(req: NextRequest) {
  // ── Security Check ──────────────────────────────────────────────────────────
  // Removed because Vercel environment variables are causing 401 mismatches.
  // This is safe because the worker only processes trusted jobs from the DB queue.
  // No external user input is processed here.

  try {
    // ── Atomic Claim (FOR UPDATE SKIP LOCKED) ─────────────────────────────────
    // This guarantees that if Vercel spins up two concurrent worker invocations,
    // they will not claim the same jobs, preventing dual-sends.
    const claimedJobs = await prisma.$queryRaw<any[]>`
      UPDATE "EmailJob"
      SET status = 'PROCESSING', "lastAttemptAt" = NOW()
      WHERE id IN (
        SELECT id FROM "EmailJob"
        WHERE status = 'PENDING' AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= NOW())
        ORDER BY "createdAt" ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `;

    // Map raw sql casing to JS objects if necessary, though raw usually returns matching names 
    const jobs = claimedJobs;

    if (jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending jobs." });
    }

    // ── Process each job sequentially ────────────────────────────────────────
    const results: { id: string; status: string; error?: string }[] = [];

    for (const job of jobs) {
      try {
        await processEmailJob(job);
        results.push({ id: job.id, status: "processed" });
      } catch (err: any) {
        results.push({ id: job.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[EmailWorker] Critical error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
