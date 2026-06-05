import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Booking, MemberProfile, User, WorkoutPlan } from "@prisma/client";

type BookingWithMember = Booking & {
  member: MemberProfile & {
    user: Pick<User, "name" | "email" | "image">;
    workouts: WorkoutPlan[];
  };
};

export default async function TrainerClientsPage({
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
          member: {
            include: {
              user: { select: { name: true, email: true, image: true } },
              workouts: true,
            },
          },
        },
        where: { status: { not: "CANCELLED" } },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!trainerProfile) redirect(`/gym/${slug}/dashboard/trainer`);

  // Deduplicate clients
  const clientMap = new Map<string, BookingWithMember>();
  trainerProfile.bookings.forEach((b: BookingWithMember) => {
    if (!clientMap.has(b.memberId)) clientMap.set(b.memberId, b);
  });
  const clients = Array.from(clientMap.values());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
        <p className="text-gray-500 mt-1">{clients.length} client{clients.length !== 1 ? "s" : ""} total</p>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-medium text-gray-600">No clients yet</p>
          <p className="text-sm mt-1">Clients will appear here once they book sessions with you</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clients.map((b: BookingWithMember) => {
            const totalSessions = trainerProfile.bookings.filter(
              (bk: BookingWithMember) => bk.memberId === b.memberId
            ).length;
            const completedSessions = trainerProfile.bookings.filter(
              (bk: BookingWithMember) => bk.memberId === b.memberId && bk.status === "COMPLETED"
            ).length;
            const workoutCount = b.member.workouts.length;

            return (
              <div key={b.memberId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold uppercase">
                    {b.member.user.name?.[0] ?? b.member.user.email?.[0] ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{b.member.user.name ?? "—"}</p>
                    <p className="text-sm text-gray-500">{b.member.user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{totalSessions}</p>
                    <p className="text-xs text-gray-500">Sessions</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-600">{completedSessions}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-indigo-600">{workoutCount}</p>
                    <p className="text-xs text-gray-500">Workouts</p>
                  </div>
                </div>
                <Link
                  href={`/gym/${slug}/dashboard/trainer/workouts?memberId=${b.memberId}`}
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition"
                >
                  Manage Workouts
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
