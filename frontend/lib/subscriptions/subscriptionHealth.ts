import { getSubscriptionsForHealth, SubscriptionHealthRecord } from "@/lib/repositories/subscriptionRepository";
import { now, hoursBetween } from "@/lib/date/dateUtils";
import { getSubscriptionHealthState } from "@/lib/subscriptions/memberSubscriptionState";

export type SubscriptionHealthSummaryDTO = Readonly<{
  metrics: Readonly<{
    active: number;
    expired: number;
    suspended: number;
    pastDue: number;
    cancelled: number;
    expiring24h: number;
    expiring3d: number;
    expiring7d: number;
    inactivePercentage: number;
  }>;
  subscriptions: ReadonlyArray<SubscriptionHealthRecord>;
}>;

export async function getSubscriptionHealthSummary(tenantId: string): Promise<SubscriptionHealthSummaryDTO> {
  const subscriptions = await getSubscriptionsForHealth(tenantId);
  const referenceDate = now();

  let active = 0, expired = 0, suspended = 0, pastDue = 0, cancelled = 0;
  let expiring24h = 0, expiring3d = 0, expiring7d = 0;

  for (const sub of subscriptions) {
    const state = getSubscriptionHealthState(sub, referenceDate);
    
    // Status Bucketing
    if (state === "ACTIVE") active++;
    else if (state === "EXPIRED") expired++;
    else if (state === "SUSPENDED") suspended++;
    else if (state === "PENDING_PAYMENT") pastDue++;
    else if (state === "CANCELLED") cancelled++;

    // Expiry Bucketing (Strictly Non-overlapping in hours)
    if (state === "ACTIVE") {
      const hoursLeft = hoursBetween(referenceDate, sub.endDate);

      if (hoursLeft > 0 && hoursLeft <= 24) {
        expiring24h++;
      } else if (hoursLeft > 24 && hoursLeft <= 72) {
        expiring3d++;
      } else if (hoursLeft > 72 && hoursLeft <= 168) {
        expiring7d++;
      }
    }
  }

  const total = subscriptions.length;
  // Calculate Inactive Member Percentage instead of Churn (since historical data isn't tracked robustly)
  const inactivePercentage = total > 0 ? Math.round(((expired + suspended + pastDue + cancelled) / total) * 100) : 0;

  return {
    metrics: { active, expired, suspended, pastDue, cancelled, expiring24h, expiring3d, expiring7d, inactivePercentage },
    subscriptions,
  };
}
