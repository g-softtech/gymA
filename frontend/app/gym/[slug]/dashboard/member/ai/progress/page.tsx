import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AIProgressAnalyzer from "@/components/ai/AIProgressAnalyzer";

export default async function AIProgressPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) return null;
  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      progressRecords: { orderBy: { recordedAt: "asc" } },
      attendances: { orderBy: { checkInTime: "asc" } },
      workouts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!memberProfile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Progress Analyzer</h1>
        <p className="text-gray-500 mt-1">
          Get AI-powered insights into your fitness journey
        </p>
      </div>
      <AIProgressAnalyzer
        memberData={{
          weightKg: memberProfile?.weightKg ?? null,
          heightCm: memberProfile?.heightCm ?? null,
          fitnessGoals: memberProfile?.fitnessGoals ?? [],
          progressRecords: (memberProfile?.progressRecords ?? []).map((r) => ({
            weightKg: r.weightKg,
            bodyFatPct: r.bodyFatPct,
            muscleMass: r.muscleMass,
            waistCm: r.waistCm,
            recordedAt: r.recordedAt.toISOString(),
          })),
          totalAttendance: memberProfile?.attendances.length ?? 0,
          totalWorkouts: memberProfile?.workouts.length ?? 0,
        }}
      />
    </div>
  );
}
