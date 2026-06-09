import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NutritionPage({
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
      mealPlans: { orderBy: { createdAt: "desc" }, take: 3 },
      foodLogs: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      },
    },
  });

  // Today's totals
  const todayLogs = memberProfile?.foodLogs ?? [];
  const todayCalories = todayLogs.reduce((s, l) => s + l.calories, 0);
  const todayProtein = todayLogs.reduce((s, l) => s + l.protein, 0);
  const todayCarbs = todayLogs.reduce((s, l) => s + l.carbs, 0);
  const todayFats = todayLogs.reduce((s, l) => s + l.fats, 0);

  // BMI
  const profile = memberProfile;
  const bmi =
    profile?.weightKg && profile?.heightCm
      ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
      : null;

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5
      ? { label: "Underweight", color: "text-blue-600", bg: "bg-blue-50" }
      : parseFloat(bmi) < 25
      ? { label: "Normal weight", color: "text-green-600", bg: "bg-green-50" }
      : parseFloat(bmi) < 30
      ? { label: "Overweight", color: "text-yellow-600", bg: "bg-yellow-50" }
      : { label: "Obese", color: "text-red-600", bg: "bg-red-50" }
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrition & Meal Planner</h1>
          <p className="text-gray-500 mt-1">Track your diet and manage your meal plans</p>
        </div>
        <Link
          href={`/gym/${slug}/dashboard/member/nutrition/log`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Log Food
        </Link>
      </div>

      {/* BMI Card */}
      {bmi && bmiCategory ? (
        <div className={`rounded-xl p-5 ${bmiCategory.bg} border border-opacity-20`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Your BMI</p>
              <p className={`text-4xl font-extrabold mt-1 ${bmiCategory.color}`}>{bmi}</p>
              <p className={`text-sm font-semibold mt-1 ${bmiCategory.color}`}>
                {bmiCategory.label}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500 space-y-1">
              <p>Weight: <span className="font-medium text-gray-900">{profile?.weightKg}kg</span></p>
              <p>Height: <span className="font-medium text-gray-900">{profile?.heightCm}cm</span></p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
            {[
              { label: "Underweight", range: "< 18.5", color: "bg-blue-200" },
              { label: "Normal", range: "18.5–24.9", color: "bg-green-200" },
              { label: "Overweight", range: "25–29.9", color: "bg-yellow-200" },
              { label: "Obese", range: "≥ 30", color: "bg-red-200" },
            ].map((c) => (
              <div key={c.label} className={`${c.color} rounded-lg p-2`}>
                <p className="font-semibold">{c.label}</p>
                <p className="opacity-70">{c.range}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          ⚠️ Update your weight and height in{" "}
          <Link href={`/gym/${slug}/dashboard/member/profile`} className="underline font-medium">
            My Profile
          </Link>{" "}
          to see your BMI.
        </div>
      )}

      {/* Today's summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Intake</h2>
          <Link
            href={`/gym/${slug}/dashboard/member/nutrition/log`}
            className="text-sm text-indigo-600 hover:underline"
          >
            View Log →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Calories", value: todayCalories, unit: "kcal", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Protein", value: todayProtein.toFixed(1), unit: "g", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Carbs", value: todayCarbs.toFixed(1), unit: "g", color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Fats", value: todayFats.toFixed(1), unit: "g", color: "text-red-600", bg: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.unit}</p>
              <p className="text-xs font-medium text-gray-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        {todayLogs.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-4">
            No food logged today.{" "}
            <Link href={`/gym/${slug}/dashboard/member/nutrition/log`} className="text-indigo-600 hover:underline">
              Log your first meal
            </Link>
          </p>
        )}
      </div>

      {/* Meal Plans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">My Meal Plans</h2>
          <Link
            href={`/gym/${slug}/dashboard/member/nutrition/plans`}
            className="text-sm text-indigo-600 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {(memberProfile?.mealPlans ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-gray-400 mb-3">No meal plans yet.</p>
              <Link
                href={`/gym/${slug}/dashboard/member/nutrition/plans`}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Create a Meal Plan
              </Link>
            </div>
          ) : (
            memberProfile?.mealPlans.map((p) => (
              <div key={p.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-sm text-gray-500">
                    {p.totalCalories} kcal · {p.goal.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.isAiGenerated && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      🤖 AI
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString("en-NG", {
                      month: "short", day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { href: `nutrition/log`, label: "Food Log", icon: "📝", desc: "Track daily meals" },
          { href: `nutrition/plans`, label: "Meal Plans", icon: "🥗", desc: "View & create plans" },
          { href: `nutrition/foods`, label: "Food Database", icon: "🍎", desc: "Nigerian & local foods" },
        ].map((item) => (
          <Link
            key={item.href}
            href={`/gym/${slug}/dashboard/member/${item.href}`}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
