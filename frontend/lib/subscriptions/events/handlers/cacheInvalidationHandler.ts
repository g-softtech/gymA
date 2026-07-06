import { revalidateTag } from "next/cache";
import { subscriptionDomainBus } from "../bus";
import { AnySubscriptionEvent } from "../events";

/**
 * Handles Cache Invalidation for all Subscription Domain Events.
 * Since stale data affects correctness on the frontend, failure here will bubble up.
 */
export async function handleCacheInvalidation(event: AnySubscriptionEvent) {
  console.log(`[CacheInvalidationHandler] Invalidating cache for tenant ${event.tenantId} due to ${event.type}`);
  revalidateTag(`tenant-subscriptions-${event.tenantId}`, "default");
}

// Register handler for all subscription events
const eventTypes: AnySubscriptionEvent["type"][] = [
  "SubscriptionActivated",
  "SubscriptionRenewed",
  "SubscriptionCancelled",
  "SubscriptionSuspended",
  "SubscriptionExpired",
];

export function registerCacheHandlers() {
  eventTypes.forEach((type) => {
    subscriptionDomainBus.subscribe(type, handleCacheInvalidation);
  });
}
