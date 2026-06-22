
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { User, MemberProfile, Subscription, MembershipPlan } from "@prisma/client";
import MembershipAnalyticsClient from "./MembershipAnalyticsClient";
import UpgradeIntelligenceClient from "./UpgradeIntelligenceClient";

type UserWithProfile = User & {
  memberProfile:
    | (MemberProfile & {
        subscriptions: (Subscription & { plan: MembershipPlan })[];
      })
    | null;
};

export default async function AdminMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600 font-semibold">Access Denied — Admins only.</p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      users: {
        where: { role: { notIn: ["SUPERADMIN"] } },
        include: {
          memberProfile: {
            include: {
              subscriptions: {
                include: { plan: true },
                orderBy: { startDate: "desc" },
                take: 1,
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!tenant) return null;

  if (!tenant) return <p>Gym not found.</p>;

  const members = tenant.users as UserWithProfile[];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <p className="text-gray-500 mt-1">{members.length} registered member{members.length !== 1 ? "s" : ""}</p>
      </div>

      <MembershipAnalyticsClient />
      <UpgradeIntelligenceClient />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Start Date</th>
                <th className="px-6 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No members yet. Members join by purchasing a plan.
                  </td>
                </tr>
              ) : (
                members.map((user: UserWithProfile) => {
                  const sub = user.memberProfile?.subscriptions[0];
                  const isActive = sub?.status === "ACTIVE" && new Date(sub.endDate) > new Date();
                  const isExpired = sub && new Date(sub.endDate) < new Date();
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
                            {user.name?.[0] ?? user.email?.[0] ?? "?"}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{user.name ?? "—"}</span>
                            {user.role === "TRAINER" && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Trainer</span>}
                            {user.role === "ADMIN" && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{user.email ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {sub?.plan?.name ?? (
                          <span className="text-gray-400 italic">No plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!sub ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No plan</span>
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
                          ? new Date(sub.startDate).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
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
    </div>
  );
}
