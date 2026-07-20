
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSubscriptionHealthState } from "@/lib/subscriptions/memberSubscriptionState";
import type { User, MemberProfile, Subscription, MembershipPlan } from "@prisma/client";
import MembershipAnalyticsClient from "./MembershipAnalyticsClient";
import UpgradeIntelligenceClient from "./UpgradeIntelligenceClient";
import ImpersonateButton from "@/components/admin/ImpersonateButton";

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">{members.length} registered member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Link 
          href={`/gym/${slug}/dashboard/admin/members/health`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          View Subscription Health
        </Link>
      </div>

      <MembershipAnalyticsClient />
      <UpgradeIntelligenceClient />

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Start Date</th>
                <th className="px-6 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No members yet. Members join by purchasing a plan.
                  </td>
                </tr>
              ) : (
                members.map((user: UserWithProfile) => {
                  const sub = user.memberProfile?.subscriptions?.[0];
                  const healthState = getSubscriptionHealthState(sub);
                  return (
                    <tr key={user.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                              {user.name?.[0] ?? user.email?.[0] ?? "?"}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">{user.name ?? "—"}</span>
                              {user.role === "TRAINER" && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">Trainer</span>}
                              {user.role === "ADMIN" && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Admin</span>}
                            </div>
                          </div>
                          <ImpersonateButton userId={user.id} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email ?? "—"}</td>
                      <td className="px-6 py-4 text-foreground">
                        {sub?.plan?.name ?? (
                          <span className="text-muted-foreground italic">No plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {healthState === "UNKNOWN" ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">No plan</span>
                        ) : healthState === "EXPIRED" ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">Expired</span>
                        ) : healthState === "ACTIVE" ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">Active</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">{healthState}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {sub
                          ? new Date(sub.startDate).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
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
