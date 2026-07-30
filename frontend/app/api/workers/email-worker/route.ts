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
import { processEmailJob } from "@/lib/email/emailService";

const BATCH_SIZE = 10; // Max jobs to process per invocation

export async function GET(req: NextRequest) {
  // ── Security Check ──────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── Fetch pending jobs that are ready to be processed ────────────────────
    const jobs = await prisma.emailJob.findMany({
      where: {
        status: { in: ["PENDING"] },
        nextRetryAt: { lte: new Date() },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending jobs." });
    }

    // ── Process each job sequentially ────────────────────────────────────────
    const results: { id: string; status: string; error?: string }[] = [];

    for (const job of jobs) {
      try {
        await processEmailJob(job.id);
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
