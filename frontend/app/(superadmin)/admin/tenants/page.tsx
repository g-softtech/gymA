import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TenantActionButtons from "./components/TenantActionButtons";

export default async function SuperAdminTenantsPage() {
  const session = await getAuthSession();

  if (!session?.user) return null;
  const tenants = await prisma.tenant.findMany({
    include: {
      settings: {
        select: {
          logoUrl: true,
          primaryColor: true,
          city: true,
          country: true,
          customDomain: true,
          subdomain: true,
        },
      },
      _count: {
        select: { users: true, membershipPlans: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const planColors: Record<string, string> = {
    FREE: "bg-slate-700/60 text-slate-300 border-slate-600",
    STARTER: "bg-blue-900/60 text-blue-300 border-blue-700",
    PROFESSIONAL: "bg-violet-900/60 text-violet-300 border-violet-700",
    ENTERPRISE: "bg-amber-900/60 text-amber-300 border-amber-700",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    SUSPENDED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gyms</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tenants.length} gym{tenants.length !== 1 ? "s" : ""} on the platform
          </p>
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
                  Slug / Domain
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Users
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Plans
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {/* Gym name + avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{
                          background: tenant.settings?.primaryColor
                            ? tenant.settings.primaryColor
                            : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                        }}
                      >
                        {tenant.settings?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tenant.settings.logoUrl}
                            alt={tenant.name}
                            className="w-7 h-7 object-contain rounded"
                          />
                        ) : (
                          tenant.name[0]
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{tenant.name}</p>
                        {tenant.settings?.city && (
                          <p className="text-xs text-muted-foreground">
                            {tenant.settings.city}, {tenant.settings.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Slug / domain */}
                  <td className="px-6 py-4">
                    <p className="text-muted-foreground font-mono text-xs">/{tenant.slug}</p>
                    {tenant.settings?.customDomain && (
                      <p className="text-xs text-indigo-400 mt-0.5">
                        {tenant.settings.customDomain}
                      </p>
                    )}
                  </td>

                  {/* Plan badge */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${planColors[tenant.plan] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}
                    >
                      {tenant.plan}
                    </span>
                  </td>

                  {/* User count */}
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground font-semibold">
                      {tenant._count.users}
                    </span>
                  </td>

                  {/* Membership plans count */}
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground">{tenant._count.membershipPlans}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColors[tenant.status] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}
                    >
                      {tenant.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <TenantActionButtons tenantId={tenant.id} currentStatus={tenant.status} />
                      <Link
                      href={`/gym/${tenant.slug}/dashboard/admin`}
                      target="_blank"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                      id={`view-gym-${tenant.slug}`}
                    >
                      View →
                    </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tenants.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🏢</p>
              <p className="text-sm">No gyms on the platform yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
