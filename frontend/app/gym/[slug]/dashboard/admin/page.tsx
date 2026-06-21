import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { User, MemberProfile, Subscription, MembershipPlan } from "@prisma/client";

type UserWithProfile = User & {
  memberProfile:
    | (MemberProfile & {
        subscriptions: (Subscription & { plan: MembershipPlan })[];
      })
    | null;
};

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  // if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <p className="text-red-600 font-semibold text-lg">Access Denied — Admins only.</p>
  //     </div>
  //   );
  // }



  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      membershipPlans: true,
      users: {
        include: {
          memberProfile: {
            include: {
              subscriptions: { include: { plan: true }, orderBy: { startDate: "desc" }, take: 1 },
            },
          },
        },
        where: { role: { notIn: ["SUPERADMIN"] } },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!tenant) return null;

  if (!tenant) return <p>Gym not found.</p>;

  const totalMembers = tenant.users.length;

  const activeSubscriptions = tenant.users.filter(
    (u: UserWithProfile) => u.memberProfile?.subscriptions?.[0]?.status === "ACTIVE"
  ).length;

  const revenue = tenant.users.reduce((sum: number, u: UserWithProfile) => {
    const sub = u.memberProfile?.subscriptions?.[0];
    if (sub?.status === "ACTIVE") return sum + Number(sub.plan?.price ?? 0);
    return sum;
  }, 0);

  const totalPlans = tenant.membershipPlans.length;

  const stats = [
    { label: "Total Members", value: totalMembers, color: "bg-indigo-50 text-indigo-700", icon: "👥" },
    { label: "Active Subscriptions", value: activeSubscriptions, color: "bg-green-50 text-green-700", icon: "✅" },
    { label: "Revenue (Active)", value: `₦${revenue.toLocaleString()}`, color: "bg-yellow-50 text-yellow-700", icon: "💰" },
    { label: "Membership Plans", value: totalPlans, color: "bg-purple-50 text-purple-700", icon: "📋" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">{tenant.name} — Management Overview</p>
        </div>
        <Link
          href={`/gym/${slug}/dashboard/admin/plans`}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + Manage Plans
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <span className="text-sm text-gray-500">{totalMembers} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenant.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No members yet.
                  </td>
                </tr>
              ) : (
                tenant.users.map((user: UserWithProfile) => {
                  const sub = user.memberProfile?.subscriptions?.[0];
                  const isActive = sub?.status === "ACTIVE";
                  const isExpired = sub && new Date(sub.endDate) < new Date();
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.name ?? "—"}
                        {user.role === "TRAINER" && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Trainer</span>}
                        {user.role === "ADMIN" && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Admin</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{user.email ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {sub?.plan?.name ?? <span className="text-gray-400 italic">No plan</span>}
                      </td>
                      <td className="px-6 py-4">
                        {!sub ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">None</span>
                        ) : isExpired ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Expired</span>
                        ) : isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{sub.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {sub
                          ? new Date(sub.endDate).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Membership Plans</h2>
          <Link href={`/gym/${slug}/dashboard/admin/plans`} className="text-sm text-indigo-600 hover:underline">
            Manage →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {tenant.membershipPlans.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400">No plans created yet.</p>
          ) : (
            tenant.membershipPlans.map((plan: MembershipPlan) => {
              const planSubs = tenant.users.filter(
                (u: UserWithProfile) =>
                  u.memberProfile?.subscriptions?.[0]?.planId === plan.id &&
                  u.memberProfile?.subscriptions?.[0]?.status === "ACTIVE"
              ).length;
              return (
                <div key={plan.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-500">{plan.durationDays} days</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₦{plan.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {planSubs} active subscriber{planSubs !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
