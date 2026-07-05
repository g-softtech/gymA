import { NextRequest, NextResponse } from "next/server";
import { processExpiringSubscriptions } from "@/lib/subscriptions/lifecycleEngine";
import { processPlatformSubscriptions } from "@/lib/subscriptions/platformLifecycleEngine";
import { runBillingReconciliationJob } from "@/lib/billing/billingReconciliationJob";
import { detectRevenueLeaks } from "@/lib/billing/revenueLeakDetector";
import { acquireLock, releaseLock } from "@/lib/distributedLock";
import { logger } from "@/lib/logger";
// Side-effect import: registers all billing event listeners
import "@/lib/billing/billingNotifications";

export async function GET(req: NextRequest) {
  // 1. Authenticate cron job
  // (In Vercel, you can use the CRON_SECRET headers, or pass a secure token in the URL)
  const authHeader = req.headers.get("authorization");
  
  // NOTE: If using Vercel Cron, you should check req.headers.get('x-vercel-cron')
  // We'll allow a standard Bearer token or Vercel cron header.
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    req.headers.get("x-vercel-cron") !== "1"
  ) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const correlationId = crypto.randomUUID();

    // ── Execute Engines with Distributed Locks ─────────────────────────────

    let lifecycleProcessed = 0;
    if (await acquireLock({ lockId: "platformLifecycleEngine", timeoutMs: 300000, correlationId })) {
      try {
        lifecycleProcessed = await processPlatformSubscriptions();
      } finally {
        await releaseLock("platformLifecycleEngine", correlationId);
      }
    }

    if (await acquireLock({ lockId: "billingReconciliation", timeoutMs: 300000, correlationId })) {
      try {
        await runBillingReconciliationJob();
      } finally {
        await releaseLock("billingReconciliation", correlationId);
      }
    }

    if (await acquireLock({ lockId: "revenueLeakDetector", timeoutMs: 60000, correlationId })) {
      try {
        await detectRevenueLeaks();
      } finally {
        await releaseLock("revenueLeakDetector", correlationId);
      }
    }

    return NextResponse.json({
      success: true,
      processed: lifecycleProcessed,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("CRON_ERROR", { error: String(error) });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
