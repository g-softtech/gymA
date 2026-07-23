import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getSubscriptionHealthSummary } from "@/lib/subscriptions/subscriptionHealth";
import { getPaginatedSubscriptions } from "@/lib/repositories/subscriptionRepository";
import { MetricGrid } from "@/components/dashboard/MetricGrid";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { MembershipStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

const getCachedHealthSummary = unstable_cache(
  async (tenantId: string) => getSubscriptionHealthSummary(tenantId),
  ["tenant-subscription-health"],
  { tags: ["tenant-subscriptions"] } 
);

async function getHealthSummary(tenantId: string) {
  // Pass the tenantId to a dynamically tagged wrapper to ensure the tag is properly scoped per-tenant
  const fetcher = unstable_cache(
    async () => getSubscriptionHealthSummary(tenantId),
    [`health-summary-${tenantId}`],
    { tags: [`tenant-subscriptions-${tenantId}`], revalidate: 3600 }
  );
  return fetcher();
}

export default async function SubscriptionHealthDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const session = await getAuthSession();

  // 1. Strict Authorization (derive tenantId from session)
  if (!session?.user) redirect("/auth/signin");
  
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600 font-semibold">Access Denied — Admins only.</p>
      </div>
    );
  }

  // Superadmins can view any tenant. Regular admins must only view their own.
  const tenantId = session.user.role === "SUPERADMIN" ? undefined : session.user.tenantId;

  const tenantQuery = tenantId 
    ? { slug, id: tenantId } // Verify the slug matches the admin's tenantId
    : { slug };

  const tenant = await prisma.tenant.findFirst({
    where: tenantQuery,
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) {
    notFound(); // Prevents horizontal escalation
  }

  // 2. Fetch Aggregated Metrics (Cached per tenant)
  const summary = await getHealthSummary(tenant.id);
  const { metrics } = summary;

  // 3. Server-side Pagination
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const take = 15;
  const skip = (currentPage - 1) * take;

  const { data: tableData, total } = await getPaginatedSubscriptions(tenant.id, skip, take);
  const totalPages = Math.ceil(total / take);

  const statusColors: Record<MembershipStatus, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    PENDING_PAYMENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    SUSPENDED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    EXPIRED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    CANCELLED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    REPLACED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Member Subscription Health</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Detailed breakdown of member billing states and impending expiries.
        </p>
      </div>

      {/* Metrics */}
      <MetricGrid columns={3}>
        <MetricCard label="Active / Healthy" value={metrics.active} textColorClass="text-emerald-500" />
        <MetricCard label="Past Due" value={metrics.pastDue} textColorClass="text-amber-500" />
        <MetricCard label="Suspended" value={metrics.suspended} textColorClass="text-rose-500" />
      </MetricGrid>

      <MetricGrid columns={3}>
        <MetricCard label="Expired" value={metrics.expired} textColorClass="text-red-500" />
        <MetricCard label="Cancelled" value={metrics.cancelled} textColorClass="text-slate-500" />
        <MetricCard label="Inactive %" value={`${metrics.inactivePercentage}%`} textColorClass="text-muted-foreground" />
      </MetricGrid>

      <MetricGrid columns={3}>
        <MetricCard label="Expiring in 24h" value={metrics.expiring24h} textColorClass="text-orange-500" />
        <MetricCard label="Expiring in 3d" value={metrics.expiring3d} textColorClass="text-amber-500" />
        <MetricCard label="Expiring in 7d" value={metrics.expiring7d} textColorClass="text-amber-600" />
      </MetricGrid>

      {/* Table */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Subscription Details</h2>
        <DataTable
          columns={[
            { key: "member", label: "Member" },
            { key: "plan", label: "Plan" },
            { key: "status", label: "Status" },
            { key: "started", label: "Started" },
            { key: "expires", label: "Expires" },
          ]}
          currentPage={currentPage}
          totalPages={totalPages}
          baseHref={`/gym/${tenant.slug}/dashboard/admin/members/health`}
        >
          {tableData.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                No subscriptions found.
              </td>
            </tr>
          ) : (
            tableData.map((sub) => (
              <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-medium text-foreground">{sub.member?.user?.name || sub.member?.user?.email || "—"}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">{sub.plan?.name || "Custom Plan"}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      statusColors[sub.status] || "bg-slate-700 text-slate-300 border-slate-600"
                    }`}
                  >
                    {sub.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground text-sm">
                    {sub.startDate.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted-foreground text-sm">
                    {sub.endDate.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>
    </div>
  );
}
