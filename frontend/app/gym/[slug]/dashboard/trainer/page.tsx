import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Booking, MemberProfile, User } from "@prisma/client";

type BookingWithMember = Booking & {
  member: MemberProfile & { user: Pick<User, "name" | "email"> };
};

export default async function TrainerDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();



  let trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session!.user.id },
    include: {
      bookings: {
        include: {
          member: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
        orderBy: { date: "asc" },
      },
      workoutPlans: true,
    },
  });

  // Auto-create trainer profile if missing
  if (!trainerProfile) {
    await prisma.trainerProfile.create({
      data: { userId: session!.user.id, specialties: [], availability: {} },
    });
    redirect(`/gym/${slug}/dashboard/trainer`);
  }

  const now = new Date();
  const upcomingBookings = trainerProfile.bookings.filter(
    (b: BookingWithMember) => new Date(b.date) >= now && b.status !== "CANCELLED"
  );
  const pendingBookings = trainerProfile.bookings.filter(
    (b: BookingWithMember) => b.status === "PENDING"
  );
  const completedBookings = trainerProfile.bookings.filter(
    (b: BookingWithMember) => b.status === "COMPLETED"
  );
  const clientIds = new Set(trainerProfile.bookings.map((b: BookingWithMember) => b.memberId));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trainer Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session!.user.name ?? session!.user.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Upcoming Sessions", value: upcomingBookings.length, icon: "📅", color: "bg-primary/10 text-primary" },
          { label: "Pending Approvals", value: pendingBookings.length, icon: "⏳", color: "bg-warning/10 text-warning" },
          { label: "Total Clients", value: clientIds.size, icon: "👥", color: "bg-success/10 text-success" },
          { label: "Completed Sessions", value: completedBookings.length, icon: "✅", color: "bg-secondary/10 text-secondary" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending approvals alert */}
      {pendingBookings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-yellow-800 mb-3">
            ⏳ {pendingBookings.length} Booking Request{pendingBookings.length > 1 ? "s" : ""} Awaiting Your Approval
          </h2>
          <div className="space-y-2">
            {pendingBookings.slice(0, 3).map((b: BookingWithMember) => (
              <div key={b.id} className="flex justify-between items-center bg-card text-card-foreground rounded-lg px-4 py-3 border border-yellow-100">
                <div>
                  <p className="font-medium text-foreground">
                    {b.member.user.name ?? b.member.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(b.date).toLocaleDateString("en-NG", {
                      weekday: "short", month: "short", day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(b.date).toLocaleTimeString("en-NG", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                    {" · "}{b.sessionType}
                  </p>
                </div>
                <Link
                  href={`/gym/${slug}/dashboard/trainer/bookings`}
                  className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Upcoming Sessions</h2>
          <Link
            href={`/gym/${slug}/dashboard/trainer/schedule`}
            className="text-sm text-indigo-600 hover:underline"
          >
            View Schedule →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {upcomingBookings.length === 0 ? (
            <p className="px-6 py-8 text-center text-muted-foreground">No upcoming sessions.</p>
          ) : (
            upcomingBookings.slice(0, 5).map((b: BookingWithMember) => (
              <div key={b.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold uppercase">
                    {b.member.user.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {b.member.user.name ?? b.member.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {b.durationMins} min · {b.sessionType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(b.date).toLocaleDateString("en-NG", {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.date).toLocaleTimeString("en-NG", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { href: `/gym/${slug}/dashboard/trainer/clients`, label: "My Clients", icon: "👥" },
          { href: `/gym/${slug}/dashboard/trainer/workouts`, label: "Workout Plans", icon: "💪" },
          { href: `/gym/${slug}/dashboard/trainer/schedule`, label: "My Schedule", icon: "📅" },
          { href: `/gym/${slug}/dashboard/trainer/bookings`, label: "Bookings", icon: "📋" },
          { href: `/gym/${slug}/dashboard/trainer/progress`, label: "Progress", icon: "📊" },
          { href: `/gym/${slug}/dashboard/trainer/messages`, label: "Messages", icon: "💬" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-card text-card-foreground rounded-xl border border-border p-4 text-center hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-xs font-semibold text-foreground">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
