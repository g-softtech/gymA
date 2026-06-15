import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import FoodLogManager from "@/components/member/FoodLogManager";

export default async function FoodLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date: dateParam } = await searchParams;
  const session = await getAuthSession();


  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  selectedDate.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session!.user.id },
    include: {
      foodLogs: {
        where: { date: { gte: selectedDate, lte: endOfDay } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!memberProfile) return null;

  if (!memberProfile) {
    await prisma.memberProfile.create({
      data: { userId: session!.user.id, fitnessGoals: [] },
    });
    redirect(`/gym/${slug}/dashboard/member/nutrition/log`);
  }

  const logs = memberProfile.foodLogs;
  const totalCalories = logs.reduce((s, l) => s + l.calories, 0);
  const totalProtein = logs.reduce((s, l) => s + l.protein, 0);
  const totalCarbs = logs.reduce((s, l) => s + l.carbs, 0);
  const totalFats = logs.reduce((s, l) => s + l.fats, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Food Log</h1>
        <p className="text-gray-500 mt-1">Track everything you eat throughout the day</p>
      </div>

      <FoodLogManager
        memberId={memberProfile.id}
        selectedDate={selectedDate.toISOString()}
        logs={logs.map((l) => ({
          id: l.id,
          mealType: l.mealType,
          foodName: l.foodName,
          calories: l.calories,
          protein: l.protein,
          carbs: l.carbs,
          fats: l.fats,
          quantity: l.quantity,
          unit: l.unit,
        }))}
        totals={{ calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fats: totalFats }}
      />
    </div>
  );
}
