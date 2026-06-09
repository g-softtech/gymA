import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MealPlanManager from "@/components/member/MealPlanManager";

export default async function MealPlansPage({
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
      mealPlans: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!memberProfile) redirect(`/gym/${slug}/dashboard/member/nutrition`);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
        <p className="text-gray-500 mt-1">Create and manage your personalised meal plans</p>
      </div>
      <MealPlanManager
        memberId={memberProfile.id}
        weightKg={memberProfile.weightKg}
        heightCm={memberProfile.heightCm}
        fitnessGoals={memberProfile.fitnessGoals}
        initialPlans={memberProfile.mealPlans.map((p) => ({
          id: p.id,
          title: p.title,
          goal: p.goal,
          totalCalories: p.totalCalories,
          protein: p.protein,
          carbs: p.carbs,
          fats: p.fats,
          meals: p.meals as any,
          isAiGenerated: p.isAiGenerated,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
