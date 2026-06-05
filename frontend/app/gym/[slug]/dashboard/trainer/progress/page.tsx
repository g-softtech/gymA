import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProgressTracker from "@/components/trainer/ProgressTracker";
import type { Booking, MemberProfile, User } from "@prisma/client";

type BookingWithMember = Booking & {
  member: MemberProfile & { user: Pick<User, "name" | "email"> };
};

export default async function TrainerProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ memberId?: string }>;
}) {
  const { slug } = await params;
  const { memberId } = await searchParams;
  const session = await getAuthSession();

  if (!session?.user) redirect(`/api/auth/signin`);

  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      bookings: {
        where: { status: { not: "CANCELLED" } },
        include: {
          member: { include: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  });

  if (!trainerProfile) redirect(`/gym/${slug}/dashboard/trainer`);

  // Deduplicate clients
  const clientMap = new Map<string, { id: string; name: string }>();
  trainerProfile.bookings.forEach((b: BookingWithMember) => {
    if (!clientMap.has(b.memberId)) {
      clientMap.set(b.memberId, {
        id: b.memberId,
        name: b.member.user.name ?? b.member.user.email ?? "Unknown",
      });
    }
  });
  const clients = Array.from(clientMap.values());

  // Fetch progress records for selected member
  const progressRecords = memberId
    ? await prisma.progressRecord.findMany({
        where: { memberId },
        orderBy: { recordedAt: "asc" },
      })
    : [];

  // Fetch member profile for current stats
  const memberProfile = memberId
    ? await prisma.memberProfile.findUnique({
        where: { id: memberId },
        include: { user: { select: { name: true, email: true } } },
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
        <p className="text-gray-500 mt-1">Record and monitor client progress over time</p>
      </div>
      <ProgressTracker
        clients={clients}
        selectedMemberId={memberId}
        memberName={memberProfile?.user.name ?? memberProfile?.user.email ?? ""}
        progressRecords={progressRecords.map((r) => ({
          id: r.id,
          weightKg: r.weightKg,
          bodyFatPct: r.bodyFatPct,
          muscleMass: r.muscleMass,
          chestCm: r.chestCm,
          waistCm: r.waistCm,
          hipsCm: r.hipsCm,
          notes: r.notes ?? "",
          recordedAt: r.recordedAt.toISOString(),
        }))}
      />
    </div>
  );
}
