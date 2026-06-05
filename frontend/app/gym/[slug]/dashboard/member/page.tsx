import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`);
  }

  if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") {
    redirect(`/gym/${slug}/dashboard/admin`);
  }
  if (session.user.role === "TRAINER") {
    redirect(`/gym/${slug}/dashboard/trainer`);
  }

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
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
      attendance: {
        orderBy: { checkedInAt: "desc" },
        take: 5,
      },
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        include: {
          trainer: { include: { user: { select: { name: true } } } },
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

  const activeSub = memberProfile?.subscriptions[0];
  const daysLeft = activeSub
    ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Unread messages count
  const unreadMessages = await prisma.message.count({
    where: { receiverId: session.user.id, read: false },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {welcome === "1" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium">
          🎉 Welcome! Your membership has been activated successfully.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="text-gray-500 mt-1">Here is your fitness overview.</p>
        </div>
        {unreadMessages > 0 && (
          <Link
            href={`/gym/${slug}/dashboard/member/messages`}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
          >
            💬 {unreadMessages} new message{unreadMessages > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Membership status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Status</h2>
        {activeSub ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium text-gray-900">{activeSub.plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expires</span>
              <span className="font-medium text-gray-900">
                {new Date(activeSub.endDate).toLocaleDateString("en-NG", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Days Left</span>
              <span className={`font-bold ${daysLeft! <= 7 ? "text-red-500" : "text-green-600"}`}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""}
              </span>
            </div>
            {daysLeft! <= 7 && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ⚠️ Your membership expires soon.{" "}
                <Link href={`/gym/${slug}`} className="underline font-medium">Renew now</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">You have no active membership plan.</p>
            <Link
              href={`/gym/${slug}`}
              className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Browse Plans
            </Link>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Workouts", value: memberProfile?.workouts.length ?? 0, icon: "💪", href: `member/workouts` },
          { label: "Attendances", value: memberProfile?.attendance.length ?? 0, icon: "📅", href: `member/attendance` },
          { label: "Bookings", value: memberProfile?.bookings.length ?? 0, icon: "📋", href: `member/bookings` },
          { label: "Progress", value: memberProfile?.progressRecords.length ?? 0, icon: "📊", href: `member/progress` },
        ].map((s) => (
          <Link
            key={s.label}
            href={`/gym/${slug}/dashboard/${s.href}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Upcoming bookings */}
      {memberProfile?.bookings && memberProfile.bookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900">Upcoming Sessions</h2>
            <Link href={`/gym/${slug}/dashboard/member/bookings`} className="text-sm text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {memberProfile.bookings.map((b) => (
              <div key={b.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    Session with {b.trainer.user.name ?? "Trainer"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                    {" "}&mdash;{" "}
                    {new Date(b.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900">Recent Workout Plans</h2>
            <Link href={`/gym/${slug}/dashboard/member/workouts`} className="text-sm text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {memberProfile.workouts.map((w) => (
              <div key={w.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{w.title}</p>
                  <p className="text-sm text-gray-500">
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
    </div>
  );
}
