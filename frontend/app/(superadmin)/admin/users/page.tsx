import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; role?: string; env?: string; page?: string }>;
}) {
  const session = await getAuthSession();

  if (!session?.user) return null;
  const { tenantId: filterTenantId, role: filterRole, env: filterEnv, page: filterPage } = await searchParams;

  const PAGE_SIZE = 50;
  const currentPage = Math.max(1, parseInt(filterPage || "1", 10));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const whereClause = {
    ...(filterTenantId ? { tenantId: filterTenantId } : {}),
    ...(filterRole
      ? {
          role: filterRole as "SUPERADMIN" | "ADMIN" | "TRAINER" | "MEMBER",
        }
      : {}),
    ...(filterEnv === "sandbox" ? { tenant: { isDemo: true } } : {}),
    ...(filterEnv === "real" ? { tenant: { isDemo: false } } : {}),
  };

  const [users, totalUsersCount, tenants] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true, isDemo: true } },
      },
      orderBy: { name: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
    prisma.tenant.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const roleColors: Record<string, string> = {
    SUPERADMIN: "bg-red-900/60 text-red-300 border-red-700",
    ADMIN: "bg-amber-900/60 text-amber-300 border-amber-700",
    TRAINER: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
    MEMBER: "bg-slate-700/60 text-slate-300 border-slate-600",
  };

  const roles = ["SUPERADMIN", "ADMIN", "TRAINER", "MEMBER"];

  const totalPages = Math.ceil(totalUsersCount / PAGE_SIZE);

  const getPageLink = (p: number) => {
    const query = new URLSearchParams();
    if (filterTenantId) query.set("tenantId", filterTenantId);
    if (filterRole) query.set("role", filterRole);
    if (filterEnv) query.set("env", filterEnv);
    query.set("page", p.toString());
    return `/admin/users?${query.toString()}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage members, trainers, and admins across all gyms.
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
        {/* Gym filter */}
        <select
          name="tenantId"
          defaultValue={filterTenantId ?? ""}
          id="filter-gym"
          className="bg-card text-card-foreground/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Gyms</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Role filter */}
        <select
          name="role"
          defaultValue={filterRole ?? ""}
          id="filter-role"
          className="bg-card text-card-foreground/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Environment filter */}
        <select
          name="env"
          defaultValue={filterEnv ?? ""}
          id="filter-env"
          className="bg-card text-card-foreground/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Environments</option>
          <option value="real">Real Gyms Only</option>
          <option value="sandbox">Sandboxes Only</option>
        </select>

        <button
          type="submit"
          id="apply-filters-btn"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Apply
        </button>
        <a
          href="/admin/users"
          className="text-sm text-slate-500 hover:text-slate-300 px-4 py-2 rounded-lg border border-white/5 hover:bg-card text-card-foreground/5 transition-all"
        >
          Clear
        </a>
      </form>

      {/* Table */}
      <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gym
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar + name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase shrink-0 overflow-hidden">
                        {user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.image}
                            alt={user.name ?? ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (user.name?.[0] ?? user.email?.[0] ?? "?")
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.name ?? "Unnamed User"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-3.5">
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-3.5">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${roleColors[user.role] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Gym */}
                  <td className="px-6 py-3.5">
                    {user.tenant ? (
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400 text-xs font-medium">
                          {user.tenant.name}
                        </span>
                        {user.tenant.isDemo && (
                          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Sandbox</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs italic">No gym</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-sm">No users match your filters.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 bg-card/50 px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-slate-300">{users.length > 0 ? skip + 1 : 0}</span> to <span className="font-semibold text-slate-300">{skip + users.length}</span> of <span className="font-semibold text-slate-300">{totalUsersCount}</span> users
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={currentPage > 1 ? getPageLink(currentPage - 1) : "#"}
                  className={`px-3 py-1.5 text-sm rounded-md border ${currentPage > 1 ? "border-white/10 hover:bg-white/5 text-slate-300" : "border-white/5 text-slate-600 pointer-events-none"}`}
                >
                  Previous
                </a>
                <span className="text-sm text-slate-400 px-2">Page {currentPage} of {totalPages}</span>
                <a
                  href={currentPage < totalPages ? getPageLink(currentPage + 1) : "#"}
                  className={`px-3 py-1.5 text-sm rounded-md border ${currentPage < totalPages ? "border-white/10 hover:bg-white/5 text-slate-300" : "border-white/5 text-slate-600 pointer-events-none"}`}
                >
                  Next
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
