import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BookingForm from "@/components/member/BookingForm";
import type { Booking, TrainerProfile, User } from "@prisma/client";

type BookingWithTrainer = Booking & {
  trainer: TrainerProfile & { user: Pick<User, "name" | "email"> };
};

export default async function MemberBookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) redirect(`/api/auth/signin`);

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) redirect(`/gym/${slug}/dashboard/member`);

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      bookings: {
        include: {
          trainer: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  // Get all trainers in this gym
  const trainers = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: "TRAINER" },
    include: { trainerProfile: true },
  });

  const bookings = (memberProfile?.bookings ?? []) as BookingWithTrainer[];

  const upcoming = bookings.filter(
    (b) => new Date(b.date) >= new Date() && b.status !== "CANCELLED"
  );
  const past = bookings.filter(
    (b) => new Date(b.date) < new Date() || b.status === "CANCELLED"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Trainer</h1>
        <p className="text-gray-500 mt-1">Schedule one-on-one sessions with our trainers</p>
      </div>

      <BookingForm
        tenantId={tenant.id}
        memberId={memberProfile?.id ?? ""}
        trainers={trainers.map((t) => ({
          id: t.trainerProfile?.id ?? "",
          userId: t.id,
          name: t.name ?? t.email ?? "Trainer",
          specialties: t.trainerProfile?.specialties ?? [],
          bio: t.trainerProfile?.bio ?? "",
          hourlyRate: t.trainerProfile?.hourlyRate ?? null,
          availability: (t.trainerProfile?.availability ?? {}) as Record<string, string[]>,
        }))}
      />

      {/* Upcoming bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Upcoming Sessions ({upcoming.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {upcoming.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400">No upcoming sessions.</p>
          ) : (
            upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} showCancel={true} />
            ))
          )}
        </div>
      </div>

      {/* Past bookings */}
      {past.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Past Sessions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} showCancel={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b, showCancel }: { booking: BookingWithTrainer; showCancel: boolean }) {
  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-green-100 text-green-700",
    COMPLETED: "bg-indigo-100 text-indigo-700",
    CANCELLED: "bg-red-100 text-red-600",
    RESCHEDULED: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="px-6 py-4 flex justify-between items-center">
      <div>
        <p className="font-medium text-gray-900">
          Session with {b.trainer.user.name ?? "Trainer"}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date(b.date).toLocaleDateString("en-NG", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
          {" "}&mdash;{" "}
          {new Date(b.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{b.durationMins} min · {b.sessionType}</p>
        {b.meetingLink && b.status === "CONFIRMED" && (
          <a
            href={b.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline mt-1 block"
          >
            🔗 Join Online Session
          </a>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[b.status] ?? "bg-gray-100 text-gray-500"}`}>
          {b.status}
        </span>
      </div>
    </div>
  );
}
