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

  if (!session?.user) redirect(`/api/auth/signin`);

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

  if (!trainerProfile) redirect(`/gym/${slug}/dashboard/trainer`);

  const bookings = trainerProfile.bookings as BookingWithMember[];

  const pending = bookings.filter((b) => b.status === "PENDING");
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">Review and manage all session requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pending.length, color: "bg-yellow-50 text-yellow-700", icon: "⏳" },
          { label: "Confirmed", value: confirmed.length, color: "bg-green-50 text-green-700", icon: "✅" },
          { label: "Completed", value: completed.length, color: "bg-indigo-50 text-indigo-700", icon: "🏆" },
          { label: "Cancelled", value: cancelled.length, color: "bg-red-50 text-red-700", icon: "❌" },
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
