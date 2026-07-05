import { prisma } from "@/lib/prisma";
import { subscriptionEventBus } from "@/lib/events/subscriptionEventBus";

export async function detectRevenueLeaks() {
  const tenants = await prisma.tenant.findMany();

  for (const tenant of tenants) {
    const now = new Date();

    const isActiveButExpired =
      tenant.billingStatus === "ACTIVE" &&
      tenant.billingEndsAt &&
      tenant.billingEndsAt < now;

    if (isActiveButExpired) {
      subscriptionEventBus.emit("REVENUE_LEAK_DETECTED", {
        tenantId: tenant.id,
      });
    }
  }
}
