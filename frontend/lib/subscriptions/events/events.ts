export type SubscriptionEventType =
  | "SubscriptionActivated"
  | "SubscriptionRenewed"
  | "SubscriptionCancelled"
  | "SubscriptionSuspended"
  | "SubscriptionExpired"
  | "SubscriptionExpiring";

export interface SubscriptionEventPayload {
  subscriptionId: string;
  memberId: string;
  planId?: string;
  reason?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface DomainEvent<TPayload = SubscriptionEventPayload> {
  id: string; // Event ID (UUID)
  version: number;
  type: SubscriptionEventType;
  tenantId: string;
  correlationId: string;
  causationId?: string;
  actorId?: string; // e.g. system, admin, or user ID
  source: string; // The origin of the event (e.g. "billing.webhook", "admin.portal")
  occurredAt: Date;
  payload: TPayload;
}

// Concrete strongly-typed events
export interface SubscriptionActivatedEvent extends DomainEvent<{
  subscriptionId: string;
  memberId: string;
  planId: string;
  previousStatus?: string;
  newStatus?: string;
}> {
  type: "SubscriptionActivated";
}

export interface SubscriptionRenewedEvent extends DomainEvent<{
  subscriptionId: string;
  memberId: string;
  planId: string;
  previousStatus?: string;
  newStatus?: string;
}> {
  type: "SubscriptionRenewed";
}

export interface SubscriptionCancelledEvent extends DomainEvent<{
  subscriptionId: string;
  memberId: string;
  reason?: string;
  previousStatus?: string;
  newStatus?: string;
}> {
  type: "SubscriptionCancelled";
}

export interface SubscriptionSuspendedEvent extends DomainEvent<{
  subscriptionId: string;
  memberId: string;
  reason?: string;
  previousStatus?: string;
  newStatus?: string;
}> {
  type: "SubscriptionSuspended";
}

export interface SubscriptionExpiredEvent extends DomainEvent<{
  subscriptionId: string;
  memberId: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
}> {
  type: "SubscriptionExpired";
}

export interface SubscriptionExpiringEvent extends DomainEvent<{
  subscriptionId: string;
  memberId: string;
  daysLeft: number;
}> {
  type: "SubscriptionExpiring";
}

export type AnySubscriptionEvent =
  | SubscriptionActivatedEvent
  | SubscriptionRenewedEvent
  | SubscriptionCancelledEvent
  | SubscriptionSuspendedEvent
  | SubscriptionExpiredEvent
  | SubscriptionExpiringEvent;

export function createSubscriptionEvent<T extends AnySubscriptionEvent>(
  params: Omit<T, "id" | "occurredAt" | "version">
): T {
  return {
    ...params,
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(),
    occurredAt: new Date(),
    version: 1,
  } as T;
}
