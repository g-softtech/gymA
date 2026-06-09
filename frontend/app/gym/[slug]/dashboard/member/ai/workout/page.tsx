import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AIWorkoutGenerator from "@/components/ai/AIWorkoutGenerator";

export default async function AIWorkoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) redirect(`/api/auth/signin`);

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      progressRecords: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Fitness Coach</h1>
        <p className="text-gray-500 mt-1">
          Generate a personalised workout plan powered by Claude AI
        </p>
      </div>
      <AIWorkoutGenerator
        memberId={memberProfile?.id ?? ""}
        memberData={{
          weightKg: memberProfile?.weightKg ?? null,
          heightCm: memberProfile?.heightCm ?? null,
          fitnessGoals: memberProfile?.fitnessGoals ?? [],
          latestWeight: memberProfile?.progressRecords[0]?.weightKg ?? null,
        }}
      />
    </div>
  );
}
