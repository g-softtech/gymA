import { prisma } from "@/lib/prisma";
import { subscriptionDomainBus } from "../bus";
import { AnySubscriptionEvent } from "../events";

/**
 * Handles Audit Logging for all Subscription Domain Events.
 * Since this is critical for compliance and tracing, failure here will bubble up
 * and fail the original transaction to guarantee no untracked state mutations occur.
 */
export async function handleSubscriptionAuditLog(event: AnySubscriptionEvent) {
  console.log(`[AuditHandler] Logging event ${event.type} for tenant ${event.tenantId}`);

  await prisma.auditLog.create({
    data: {
      tenantId: event.tenantId,
      eventType: event.type,
      actorId: event.actorId,
      correlationId: event.correlationId,
      occurredAt: event.occurredAt,
      payload: event.payload as any,
    },
  });
}

// Register handler for all subscription events
const eventTypes: AnySubscriptionEvent["type"][] = [
  "SubscriptionActivated",
  "SubscriptionRenewed",
  "SubscriptionCancelled",
  "SubscriptionSuspended",
  "SubscriptionExpired",
];

export function registerAuditHandlers() {
  eventTypes.forEach((type) => {
    subscriptionDomainBus.subscribe(type, handleSubscriptionAuditLog);
  });
}
