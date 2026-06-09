import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SuperAdminTenantsPage() {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") redirect("/api/auth/signin");

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gyms</h1>
          <p className="text-slate-400 text-sm mt-1">
            {tenants.length} gym{tenants.length !== 1 ? "s" : ""} on the platform
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Gym
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Slug / Domain
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Plans
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="hover:bg-white/[0.02] transition-colors"
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
                        <p className="font-semibold text-white">{tenant.name}</p>
                        {tenant.settings?.city && (
                          <p className="text-xs text-slate-500">
                            {tenant.settings.city}, {tenant.settings.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Slug / domain */}
                  <td className="px-6 py-4">
                    <p className="text-slate-300 font-mono text-xs">/{tenant.slug}</p>
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
                    <span className="text-slate-300 font-semibold">
                      {tenant._count.users}
                    </span>
                  </td>

                  {/* Membership plans count */}
                  <td className="px-6 py-4">
                    <span className="text-slate-400">{tenant._count.membershipPlans}</span>
                  </td>

                  {/* Active status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        tenant.isActive ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tenant.isActive ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      />
                      {tenant.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <Link
                      href={`/gym/${tenant.slug}/dashboard/admin`}
                      target="_blank"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                      id={`view-gym-${tenant.slug}`}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tenants.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">🏢</p>
              <p className="text-sm">No gyms on the platform yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
