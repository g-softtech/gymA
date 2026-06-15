import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SAAS_PLANS } from "@/lib/billing";
import { TenantPlan } from "@prisma/client";

async function getPlatformStats() {
  const [
    totalTenants,
    activeTenants,
    totalUsers,
    totalAdmins,
    totalTrainers,
    totalMembers,
    recentTenants,
    totalSaaSRevenue,
    recentInvoices,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "TRAINER" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.tenant.findMany({
      take: 5,
      orderBy: { id: "desc" },
      include: {
        settings: { select: { logoUrl: true, primaryColor: true } },
        _count: { select: { users: true } },
      },
    }),
    prisma.saaSInvoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["SUCCESS", "PAID", "paid"] } },
    }),
    prisma.saaSInvoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { name: true, slug: true } } },
    }),
  ]);

  const planBreakdown = await prisma.tenant.groupBy({
    by: ["plan"],
    _count: { _all: true },
    where: { isActive: true }, // Only count active tenants for MRR
  });

  let estimatedMRR = 0;
  planBreakdown.forEach((p) => {
    const planDetails = SAAS_PLANS[p.plan as TenantPlan];
    if (planDetails && planDetails.price > 0) {
      estimatedMRR += p._count._all * planDetails.price;
    }
  });

  return {
    totalTenants,
    activeTenants,
    totalUsers,
    totalAdmins,
    totalTrainers,
    totalMembers,
    recentTenants,
    planBreakdown,
    totalRevenue: totalSaaSRevenue._sum.amount ?? 0,
    estimatedMRR,
    recentInvoices,
  };
}

export default async function SuperAdminOverviewPage() {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") redirect("/api/auth/signin");

  const stats = await getPlatformStats();

  const statCards = [
    {
      label: "Total Gyms",
      value: stats.totalTenants,
      sub: `${stats.activeTenants} active`,
      color: "from-violet-500 to-indigo-600",
      icon: "🏢",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      sub: `${stats.totalMembers} members`,
      color: "from-blue-500 to-cyan-600",
      icon: "👥",
    },
    {
      label: "Trainers",
      value: stats.totalTrainers,
      sub: "across all gyms",
      color: "from-emerald-500 to-teal-600",
      icon: "🏋️",
    },
    {
      label: "Total Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      sub: "Lifetime SaaS Revenue",
      color: "from-green-500 to-emerald-600",
      icon: "💰",
    },
    {
      label: "Est. MRR",
      value: `₦${stats.estimatedMRR.toLocaleString()}`,
      sub: "Monthly Recurring Rev",
      color: "from-blue-600 to-indigo-700",
      icon: "📈",
    },
  ];

  const planColors: Record<string, string> = {
    FREE: "bg-slate-700/50 text-slate-300",
    STARTER: "bg-blue-900/50 text-blue-300",
    PROFESSIONAL: "bg-violet-900/50 text-violet-300",
    ENTERPRISE: "bg-amber-900/50 text-amber-300",
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor all gyms and users across the CortexFit platform.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:bg-white/[0.05] transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-lg mb-3`}>
              {card.icon}
            </div>
            <p className="text-3xl font-bold text-white">{card.value.toLocaleString()}</p>
            <p className="text-sm font-medium text-slate-300 mt-0.5">{card.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Breakdown */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Subscription Plans
          </h2>
          <div className="space-y-3">
            {stats.planBreakdown.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${planColors[p.plan] ?? "bg-slate-700 text-slate-300"}`}
                >
                  {p.plan}
                </span>
                <span className="text-sm font-semibold text-white">
                  {p._count._all} gym{p._count._all !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
            {stats.planBreakdown.length === 0 && (
              <p className="text-sm text-slate-500">No data yet.</p>
            )}
          </div>
        </div>

        {/* Recent Gyms */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Recently Added Gyms
          </h2>
          <div className="space-y-3">
            {stats.recentTenants.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{
                    background: t.settings?.primaryColor
                      ? t.settings.primaryColor
                      : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  }}
                >
                  {t.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{t.name}</p>
                  <p className="text-xs text-slate-500">{t._count.users} users · /{t.slug}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planColors[t.plan] ?? "bg-slate-700 text-slate-300"}`}
                >
                  {t.plan}
                </span>
              </div>
            ))}
            {stats.recentTenants.length === 0 && (
              <p className="text-sm text-slate-500">No gyms yet.</p>
            )}
          </div>
        </div>

        {/* Recent Revenue (Phase 9B.5) */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Recent SaaS Invoices</span>
            <span className="text-xs text-indigo-400 font-medium normal-case">Phase 9B.5</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-500">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Gym</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {inv.tenant.name}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">
                      ₦{inv.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                        inv.status === "SUCCESS" || inv.status === "paid" || inv.status === "PAID" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
