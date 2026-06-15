import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkoutPlanManager from "@/components/trainer/WorkoutPlanManager";
import type { WorkoutPlan, MemberProfile, User } from "@prisma/client";

type WorkoutWithMember = WorkoutPlan & {
  member: MemberProfile & { user: Pick<User, "name" | "email"> };
};

export default async function TrainerWorkoutsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ memberId?: string }>;
}) {
  const { slug } = await params;
  const { memberId } = await searchParams;
  const session = await getAuthSession();


  if (!session?.user) return null;
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      workoutPlans: {
        include: {
          member: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      bookings: {
        where: { status: { not: "CANCELLED" } },
        include: {
          member: { include: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  });
  if (!trainerProfile) return null;


  // Deduplicate clients from bookings
  const clientMap = new Map<string, { id: string; name: string }>();
  trainerProfile.bookings.forEach((b: any) => {
    if (!clientMap.has(b.memberId)) {
      clientMap.set(b.memberId, {
        id: b.memberId,
        name: b.member.user.name ?? b.member.user.email ?? "Unknown",
      });
    }
  });
  const clients = Array.from(clientMap.values());

  const filteredPlans = memberId
    ? trainerProfile.workoutPlans.filter((w: WorkoutWithMember) => w.memberId === memberId)
    : trainerProfile.workoutPlans;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workout Plans</h1>
        <p className="text-gray-500 mt-1">Create and manage workout plans for your clients</p>
      </div>
      <WorkoutPlanManager
        trainerId={trainerProfile.id}
        clients={clients}
        initialPlans={filteredPlans.map((w: WorkoutWithMember) => ({
          id: w.id,
          title: w.title,
          memberId: w.memberId,
          memberName: w.member.user.name ?? w.member.user.email ?? "Unknown",
          routines: w.routines as any,
          isAiGenerated: w.isAiGenerated,
          createdAt: w.createdAt.toISOString(),
        }))}
        filterMemberId={memberId}
      />
    </div>
  );
}
