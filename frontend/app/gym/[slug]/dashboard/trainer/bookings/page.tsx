import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BookingApprovals from "@/components/trainer/BookingApprovals";
import type { Booking, MemberProfile, User } from "@prisma/client";

type BookingWithMember = Booking & {
  member: MemberProfile & { user: Pick<User, "name" | "email"> };
};

export default async function TrainerBookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      bookings: {
        include: {
          member: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!trainerProfile) return null;


  const bookings = trainerProfile.bookings as BookingWithMember[];

  const pending = bookings.filter((b) => b.status === "PENDING");
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-muted-foreground mt-1">Review and manage all session requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pending.length, color: "bg-warning/10 text-warning", icon: "⏳" },
          { label: "Confirmed", value: confirmed.length, color: "bg-success/10 text-success", icon: "✅" },
          { label: "Completed", value: completed.length, color: "bg-primary/10 text-primary", icon: "🏆" },
          { label: "Cancelled", value: cancelled.length, color: "bg-destructive/10 text-destructive", icon: "❌" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <BookingApprovals
        bookings={bookings.map((b) => ({
          id: b.id,
          memberName: b.member.user.name ?? b.member.user.email ?? "Unknown",
          memberEmail: b.member.user.email ?? "",
          date: b.date.toISOString(),
          durationMins: b.durationMins,
          sessionType: b.sessionType,
          status: b.status,
          notes: b.notes ?? "",
          meetingLink: b.meetingLink ?? "",
        }))}
      />
    </div>
  );
}
