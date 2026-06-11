import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getPlatformStats() {
  const [
    totalTenants,
    activeTenants,
    totalUsers,
    totalAdmins,
    totalTrainers,
    totalMembers,
    recentTenants,
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
  ]);

  const planBreakdown = await prisma.tenant.groupBy({
    by: ["plan"],
    _count: { _all: true },
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
      label: "Gym Admins",
      value: stats.totalAdmins,
      sub: "gym owners",
      color: "from-orange-500 to-amber-600",
      icon: "🔑",
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
      </div>
    </div>
  );
}
