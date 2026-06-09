import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; role?: string }>;
}) {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") redirect("/api/auth/signin");

  const { tenantId: filterTenantId, role: filterRole } = await searchParams;

  const [users, tenants] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...(filterTenantId ? { tenantId: filterTenantId } : {}),
        ...(filterRole
          ? {
              role: filterRole as "SUPERADMIN" | "ADMIN" | "TRAINER" | "MEMBER",
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
      },
      orderBy: { name: "asc" },
      take: 250,
    }),
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Users</h1>
        <p className="text-slate-400 text-sm mt-1">
          {users.length} user{users.length !== 1 ? "s" : ""} shown
          {filterRole ? ` · ${filterRole}` : ""}
          {filterTenantId ? ` · ${tenants.find((t) => t.id === filterTenantId)?.name ?? filterTenantId}` : ""}
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        {/* Gym filter */}
        <select
          name="tenantId"
          defaultValue={filterTenantId ?? ""}
          id="filter-gym"
          className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
          className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
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
          className="text-sm text-slate-500 hover:text-slate-300 px-4 py-2 rounded-lg border border-white/5 hover:bg-white/5 transition-all"
        >
          Clear
        </a>
      </form>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Gym
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {/* Avatar + name */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 overflow-hidden">
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
                      <p className="font-medium text-white">
                        {user.name ?? <span className="text-slate-500 italic">No name</span>}
                      </p>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-3.5">
                    <p className="text-slate-400 text-xs">{user.email}</p>
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
                      <span className="text-indigo-400 text-xs font-medium">
                        {user.tenant.name}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs italic">No gym</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-sm">No users match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
