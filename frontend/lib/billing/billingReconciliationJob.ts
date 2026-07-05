import { prisma } from "@/lib/prisma";
import { subscriptionEventBus } from "@/lib/events/subscriptionEventBus";
import { acquireLock, releaseLock } from "@/lib/distributedLock";
import crypto from "crypto";

export async function runBillingReconciliationJob() {
  const LOCK_ID = "cron:billing-reconciliation";
  const correlationId = crypto.randomUUID();

  const acquired = await acquireLock({
    lockId: LOCK_ID,
    timeoutMs: 5 * 60 * 1000, // 5 minutes timeout
    correlationId,
  });

  if (!acquired) {
    console.log(`[billingReconciliationJob][${correlationId}] Skipped: lock already held.`);
    return;
  }

  try {
    const tenants = await prisma.tenant.findMany();
  const now = new Date();

  const pendingEvents: Array<{ event: string; payload: any }> = [];

  for (const tenant of tenants) {
    let correctedStatus = tenant.billingStatus;

    if (tenant.billingEndsAt && tenant.billingEndsAt < now) {
      correctedStatus = "EXPIRED";
    }

    if (tenant.trialEndsAt && tenant.trialEndsAt < now && !tenant.billingEndsAt) {
      correctedStatus = "PAST_DUE";
    }

    if (correctedStatus === tenant.billingStatus) continue;

    if (correctedStatus === tenant.billingStatus) continue;

    // ── Atomic: state update + audit log in single transaction ───────────
    await prisma.$transaction(async (tx) => {
      // Optimistic concurrency: only update if state hasn't changed under us
      const updated = await tx.tenant.updateMany({
        where: { id: tenant.id, billingStatus: tenant.billingStatus },
        data: { billingStatus: correctedStatus },
      });

      if (updated.count === 0) {
        // Concurrent process already corrected this — skip
        return;
      }

      // Audit log inside same transaction — atomically committed together
      await tx.billingEvent.create({
        data: {
          tenantId: tenant.id,
          eventId: correlationId,
          eventType: "BILLING_STATE_CORRECTION",
          payload: {
            timestamp: new Date().toISOString(),
            tenantId: tenant.id,
            billingStatusBefore: tenant.billingStatus,
            billingStatusAfter: correctedStatus,
            eventType: "BILLING_STATE_CORRECTION",
            correlationId,
            cronExecutionId: correlationId,
            workerId: "billingReconciliationJob",
          },
        },
      });
    });

    // ── Post-commit: external emissions ───────────────────────────────────
    pendingEvents.push({
      event: "SUBSCRIPTION_STATE_CORRECTED",
      payload: {
        tenantId: tenant.id,
        corrected: true,
        timestamp: Date.now(),
        correlationId,
      },
    });
  }

  // Emit all events after all transactions commit
  for (const { event, payload } of pendingEvents) {
    subscriptionEventBus.emit(event as any, payload);
  }
  
  } finally {
    await releaseLock(LOCK_ID, correlationId);
  }
}
