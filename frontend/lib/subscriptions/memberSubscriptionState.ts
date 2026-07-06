import { MembershipStatus } from "@prisma/client";
import { isExpired, now } from "@/lib/date/dateUtils";

export interface BaseSubscription {
  status: MembershipStatus;
  endDate: Date;
}

export function isSubscriptionActive(subscription: BaseSubscription | null | undefined, referenceDate: Date = now()): boolean {
  if (!subscription) return false;
  return subscription.status === MembershipStatus.ACTIVE && !isExpired(subscription.endDate, referenceDate);
}

export function getSubscriptionHealthState(subscription: BaseSubscription | null | undefined, referenceDate: Date = now()): "ACTIVE" | "EXPIRED" | "SUSPENDED" | "PENDING_PAYMENT" | "CANCELLED" | "REPLACED" | "UNKNOWN" {
  if (!subscription) return "UNKNOWN";
  
  if (subscription.status === MembershipStatus.ACTIVE && !isExpired(subscription.endDate, referenceDate)) {
    return "ACTIVE";
  }
  
  if (subscription.status === MembershipStatus.EXPIRED || isExpired(subscription.endDate, referenceDate)) {
    return "EXPIRED";
  }

  return subscription.status; // SUSPENDED, PENDING_PAYMENT, CANCELLED, REPLACED
}
