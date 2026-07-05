export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tenants = await prisma.tenant.findMany();

  return Response.json({
    totalTenants: tenants.length,

    healthy: tenants.filter(t => t.billingStatus === "ACTIVE").length,
    trialing: tenants.filter(t => t.billingStatus === "TRIALING").length,
    pastDue: tenants.filter(t => t.billingStatus === "PAST_DUE").length,
    suspended: tenants.filter(t => t.billingStatus === "SUSPENDED").length,
    expired: tenants.filter(t => t.billingStatus === "EXPIRED").length,

    risk:
      tenants.filter(t => t.billingStatus === "PAST_DUE").length /
      Math.max(tenants.length, 1),
      
    // 🔥 NEW: Revenue intelligence layer (Now aggregated from structured logs via Datadog/Vercel)
    revenueMetrics: {},
  });
}
