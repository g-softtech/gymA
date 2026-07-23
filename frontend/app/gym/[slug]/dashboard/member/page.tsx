import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AccessPass } from "@/components/member/AccessPass";
import { headers } from "next/headers";

export default async function MemberDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  const session = await getAuthSession();



  const headersList = await headers();
  const isSandbox = !!headersList.get("x-guest-session-tenant-slug");

  if (!session?.user) return null;
  const memberProfile = await prisma.memberProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, fitnessGoals: [] },
    update: {},
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      workouts: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      attendances: {
        orderBy: { checkInTime: "desc" },
        take: 5,
      },
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        include: {
          trainer: { include: { user: { select: { name: true } } } },
          classSession: true,
        },
        orderBy: { date: "asc" },
        take: 3,
      },
      progressRecords: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!memberProfile) return null;

  const activeSub = memberProfile?.subscriptions[0];
  const daysLeft = activeSub
    ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isNewMember =
    memberProfile.attendances.length === 0 &&
    memberProfile.workouts.length === 0 &&
    memberProfile.subscriptions.length === 0;

  // Unread messages count
  const unreadMessages = await prisma.message.count({
    where: { receiverId: session.user.id, read: false },
  });

  const highestPlan = await prisma.membershipPlan.findFirst({
    where: { tenantId: session.user.tenantId, isActive: true },
    orderBy: { price: "desc" },
  });

  const isHighestPlan = activeSub && highestPlan && (activeSub.plan?.price ?? 0) >= highestPlan.price;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {welcome === "1" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium">
          🎉 Welcome! Your membership has been activated successfully.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isNewMember ? "Welcome" : "Welcome back"}, {session.user.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">Here is your fitness overview.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadMessages > 0 && (
            <Link
              href={`/gym/${slug}/dashboard/member/messages`}
              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition"
            >
              💬 {unreadMessages}
            </Link>
          )}
          <AccessPass />
        </div>
      </div>

      {/* Membership status */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Membership Status</h2>
        {activeSub ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground">{activeSub.plan?.name || "Custom Plan"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium text-foreground">
                {new Date(activeSub.endDate).toLocaleDateString("en-NG", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days Left</span>
              <span className={`font-bold ${daysLeft! <= 7 ? "text-red-500" : "text-green-600"}`}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""}
              </span>
            </div>
            {daysLeft! <= 7 && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ⚠️ Your membership expires soon.{" "}
                <Link href={isSandbox ? `/sandbox/${slug}/member/billing` : `/gym/${slug}#plans`} className="underline font-medium">Renew now</Link>
              </div>
            )}

            {!isHighestPlan && (
              <div className="pt-4 mt-2 border-t border-border flex justify-end">
                <Link
                  href={isSandbox ? `/sandbox/${slug}/member/billing` : `/gym/${slug}#plans`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Upgrade Plan &rarr;
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">You have no active membership plan.</p>
            <Link
              href={isSandbox ? `/sandbox/${slug}/member/billing` : `/gym/${slug}#plans`}
              className="inline-flex px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
            >
              Browse Plans
            </Link>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Workouts", value: memberProfile?.workouts.length ?? 0, icon: "💪", href: `member/workouts` },
          { label: "Attendances", value: memberProfile?.attendances.length ?? 0, icon: "📅", href: `member/attendance` },
          { label: "Bookings", value: memberProfile?.bookings.length ?? 0, icon: "📋", href: `member/bookings` },
          { label: "Progress", value: memberProfile?.progressRecords.length ?? 0, icon: "📊", href: `member/progress` },
        ].map((s) => (
          <Link
            key={s.label}
            href={`/gym/${slug}/dashboard/${s.href}`}
            className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5 text-center hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Upcoming bookings */}
      {memberProfile?.bookings && memberProfile.bookings.length > 0 && (
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h2 className="text-base font-semibold text-foreground">Upcoming Sessions</h2>
            <Link href={`/gym/${slug}/dashboard/member/bookings`} className="text-sm text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {memberProfile.bookings.map((b) => (
              <div key={b.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-foreground">
                    {b.classSessionId ? `Class: ${b.classSession?.title}` : `Session with ${b.trainer?.user.name ?? "Trainer"}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(b.date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                    {" "}&mdash;{" "}
                    {new Date(b.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  b.status === "CONFIRMED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent workouts */}
      {memberProfile?.workouts && memberProfile.workouts.length > 0 && (
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h2 className="text-base font-semibold text-foreground">Recent Workout Plans</h2>
            <Link href={`/gym/${slug}/dashboard/member/workouts`} className="text-sm text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {memberProfile.workouts.map((w) => (
              <div key={w.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-foreground">{w.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {w.isAiGenerated && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Sticky Bottom Actions for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-card text-card-foreground border-t border-border p-4 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="flex gap-3">
          <Link
            href={`/gym/${slug}/dashboard/member/bookings/new`}
            className="flex-1 bg-indigo-600 text-white text-center py-3 rounded-xl font-bold min-h-[44px]"
          >
            Book Class
          </Link>
          <Link
            href={`/gym/${slug}/dashboard/member/profile`}
            className="flex-1 bg-muted text-foreground text-center py-3 rounded-xl font-bold min-h-[44px]"
          >
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
