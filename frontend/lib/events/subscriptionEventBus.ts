import { subscriptionDomainBus } from "../subscriptions/events";

export type SubscriptionEventType =
  | "subscription_created"
  | "subscription_upgraded"
  | "subscription_downgraded"
  | "SUBSCRIPTION_TRIAL_ENDING"
  | "SUBSCRIPTION_PAST_DUE"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_REACTIVATED"
  | "SUBSCRIPTION_STATE_CORRECTED"
  | "SUBSCRIPTION_RECONCILED"
  | "REVENUE_BLOCKED_ACCESS"
  | "REVENUE_UPGRADE_ATTEMPT"
  | "REVENUE_DOWNGRADE_ATTEMPT"
  | "REVENUE_RECOVERY_SUCCESS"
  | "REVENUE_LEAK_DETECTED";

export interface SubscriptionEventPayload {
  tenantId: string;
  subscriptionId?: string;
  previousPlanCode?: string;
  previousPlanVersion?: number;
  newPlanCode?: string;
  newPlanVersion?: number;
  actor?: "system" | "user" | "admin";
  corrected?: boolean;
  timestamp?: number;
}

export interface SubscriptionEvent {
  eventId: string;
  schemaVersion: number;
  eventType: SubscriptionEventType;
  occurredAt: string;
  payload: SubscriptionEventPayload;
}

class SubscriptionEventBusClass {
  private seenEvents = new Set<string>();
  private listeners = new Map<string, Array<(payload: SubscriptionEventPayload) => void>>();

  on(type: SubscriptionEventType, handler: (payload: SubscriptionEventPayload) => void): void {
    const existing = this.listeners.get(type) ?? [];
    this.listeners.set(type, [...existing, handler]);
  }

  async emit(type: SubscriptionEventType, payload: SubscriptionEventPayload): Promise<void> {
    const ts = payload.timestamp || Date.now();
    const key = `${type}-${payload.tenantId}-${ts}`;

    if (this.seenEvents.has(key)) return;
    this.seenEvents.add(key);

    const event: SubscriptionEvent = {
      eventId: typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(),
      schemaVersion: 1,
      eventType: type,
      occurredAt: new Date(ts).toISOString(),
      payload,
    };

    try {
      console.log(`[LEGACY EVENT] ${type}`, JSON.stringify(event, null, 2));
      
      // Bridge legacy mapped events if applicable
      // This ensures legacy handlers keep firing but new systems can intercept
    } catch (err) {
      console.error("EVENT_EMISSION_FAILED", {
        type,
        payload,
        err,
      });

      // CRITICAL: do not swallow failure
      throw err;
    }

    // Invoke registered listeners (post-log, non-blocking)
    const handlers = this.listeners.get(type) ?? [];
    for (const handler of handlers) {
      // Fire-and-forget: errors in notification handlers must not block billing
      Promise.resolve(handler(payload)).catch((err) =>
        console.error(`[EVENT_LISTENER_ERROR] ${type}`, err)
      );
    }
  }
}

export const subscriptionEventBus = new SubscriptionEventBusClass();
