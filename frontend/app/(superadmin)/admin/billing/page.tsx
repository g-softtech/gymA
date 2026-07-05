import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserAccessContext } from "@/lib/access-control";

export default async function SuperAdminBillingPage() {
  const session = await getAuthSession();
  if (!session?.user) return null;

  const ctx = getUserAccessContext(session);
  if (ctx.role !== "SUPERADMIN") {
    redirect(ctx.defaultRedirect);
  }

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      billingStatus: true,
      billingEndsAt: true,
      trialEndsAt: true,
      settings: {
        select: {
          logoUrl: true,
          primaryColor: true,
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const healthy = tenants.filter(t => t.billingStatus === "ACTIVE").length;
  const trialing = tenants.filter(t => t.billingStatus === "TRIALING").length;
  const pastDue = tenants.filter(t => t.billingStatus === "PAST_DUE").length;
  const suspended = tenants.filter(t => t.billingStatus === "SUSPENDED").length;
  const expired = tenants.filter(t => t.billingStatus === "EXPIRED").length;

  const now = new Date();
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiring1 = tenants.filter(t => t.billingEndsAt && t.billingEndsAt > now && t.billingEndsAt <= in1Day).length;
  const expiring3 = tenants.filter(t => t.billingEndsAt && t.billingEndsAt > in1Day && t.billingEndsAt <= in3Days).length;
  const expiring7 = tenants.filter(t => t.billingEndsAt && t.billingEndsAt > in3Days && t.billingEndsAt <= in7Days).length;

  const churnRate = tenants.length > 0 ? Math.round(((expired + suspended) / tenants.length) * 100) : 0;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    TRIALING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PAST_DUE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    SUSPENDED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Platform revenue and tenant billing health
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active / Healthy</p>
          <p className="text-2xl font-black mt-1 text-emerald-400">{healthy}</p>
        </div>
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trialing</p>
          <p className="text-2xl font-black mt-1 text-blue-400">{trialing}</p>
        </div>
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past Due</p>
          <p className="text-2xl font-black mt-1 text-amber-400">{pastDue}</p>
        </div>
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suspended</p>
          <p className="text-2xl font-black mt-1 text-rose-400">{suspended}</p>
        </div>
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expired</p>
          <p className="text-2xl font-black mt-1 text-red-400">{expired}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiring in 24h</p>
            <p className="text-2xl font-black mt-1 text-orange-400">{expiring1}</p>
          </div>
        </div>
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiring in 3d</p>
            <p className="text-2xl font-black mt-1 text-amber-500">{expiring3}</p>
          </div>
        </div>
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiring in 7d</p>
            <p className="text-2xl font-black mt-1 text-amber-600">{expiring7}</p>
          </div>
        </div>
        <div className="bg-card text-card-foreground border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Churn Rate (Expired+Susp)</p>
            <p className="text-2xl font-black mt-1 text-rose-500">{churnRate}%</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gym
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Billing Status
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Billing Ends
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Trial Ends
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {/* Gym name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                        style={{
                          background: tenant.settings?.primaryColor || "linear-gradient(135deg, #6366F1, #8B5CF6)",
                        }}
                      >
                        {tenant.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{tenant.name}</p>
                        <p className="text-muted-foreground font-mono text-[10px]">/{tenant.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-foreground">
                      {tenant.plan}
                    </span>
                  </td>

                  {/* Billing Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        statusColors[tenant.billingStatus] || "bg-slate-700 text-slate-300 border-slate-600"
                      }`}
                    >
                      {tenant.billingStatus}
                    </span>
                  </td>

                  {/* Billing Ends At */}
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-xs">
                      {tenant.billingEndsAt
                        ? tenant.billingEndsAt.toLocaleDateString()
                        : "N/A"}
                    </span>
                  </td>

                  {/* Trial Ends At */}
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-xs">
                      {tenant.trialEndsAt
                        ? tenant.trialEndsAt.toLocaleDateString()
                        : "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
