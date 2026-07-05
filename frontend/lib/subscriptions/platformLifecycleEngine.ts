import { prisma } from "@/lib/prisma";
import { subscriptionEventBus } from "@/lib/events/subscriptionEventBus";
import { recordMetric } from "@/lib/billing/revenueMetrics";

export type TenantBillingState =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "GRACE_PERIOD"
  | "SUSPENDED"
  | "EXPIRED";

function computeState(tenant: any): TenantBillingState {
  const now = new Date();

  if (!tenant.billingEndsAt && tenant.trialEndsAt && tenant.trialEndsAt > now) {
    return "TRIALING";
  }

  if (tenant.trialEndsAt && tenant.trialEndsAt < now && !tenant.billingEndsAt) {
    return "PAST_DUE";
  }

  if (tenant.billingEndsAt && tenant.billingEndsAt > now) {
    return "ACTIVE";
  }

  if (tenant.billingEndsAt && tenant.billingEndsAt < now) {
    const gracePeriodEnd = new Date(tenant.billingEndsAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    if (now <= gracePeriodEnd) return "GRACE_PERIOD";
    return "EXPIRED";
  }

  return "ACTIVE";
}

export async function processPlatformSubscriptions() {
  const tenants = await prisma.tenant.findMany();

  // Collect post-commit emissions — external ops happen AFTER transaction commits
  const pendingEvents: Array<{ event: string; payload: any }> = [];

  for (const tenant of tenants) {
    const previousState = tenant.billingStatus;
    const newState = computeState(tenant);

    if (previousState === newState) continue;

    const correlationId = crypto.randomUUID();

    // ── Atomic: state update + audit log in single transaction ───────────
    await prisma.$transaction(async (tx) => {
      // Optimistic concurrency: only update if billingStatus hasn't changed
      // under us by a concurrent webhook/reconciliation run
      const updated = await tx.tenant.updateMany({
        where: { id: tenant.id, billingStatus: previousState },
        data: { billingStatus: newState },
      });

      if (updated.count === 0) {
        // Another process already changed state — skip to avoid overwrite
        return;
      }

      await tx.billingEvent.create({
        data: {
          tenantId: tenant.id,
          eventId: correlationId,
          eventType: "BILLING_STATE_TRANSITION",
          payload: {
            timestamp: new Date().toISOString(),
            tenantId: tenant.id,
            billingStatusBefore: previousState,
            billingStatusAfter: newState,
            eventType: "BILLING_STATE_TRANSITION",
            correlationId,
            workerId: "platformLifecycleEngine",
          },
        },
      });
    });

    // ── Post-commit: external emissions (metrics, events) ─────────────────
    recordMetric("leakedRevenueSignals");
    pendingEvents.push({ event: "REVENUE_LEAK_DETECTED", payload: { tenantId: tenant.id, from: previousState, to: newState } });

    switch (newState) {
      case "PAST_DUE":
        pendingEvents.push({ event: "SUBSCRIPTION_PAST_DUE", payload: { tenantId: tenant.id } });
        break;
      case "EXPIRED":
        pendingEvents.push({ event: "SUBSCRIPTION_EXPIRED", payload: { tenantId: tenant.id } });
        break;
      case "SUSPENDED":
        pendingEvents.push({ event: "SUBSCRIPTION_SUSPENDED", payload: { tenantId: tenant.id } });
        break;
      case "TRIALING":
        pendingEvents.push({ event: "SUBSCRIPTION_TRIAL_ENDING", payload: { tenantId: tenant.id } });
        break;
      case "ACTIVE":
        pendingEvents.push({ event: "SUBSCRIPTION_REACTIVATED", payload: { tenantId: tenant.id } });
        break;
    }
  }

  // Emit all events after all transactions commit
  for (const { event, payload } of pendingEvents) {
    subscriptionEventBus.emit(event as any, payload);
  }

  return pendingEvents.length;
}
