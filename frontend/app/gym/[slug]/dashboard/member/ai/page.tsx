import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AIHubPage({
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
      progressRecords: { orderBy: { recordedAt: "desc" }, take: 3 },
      workouts: { orderBy: { createdAt: "desc" }, take: 1 },
      mealPlans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!memberProfile) return null;

  const features = [
    {
      href: `ai/workout`,
      title: "AI Fitness Coach",
      description: "Generate a personalised workout plan based on your goals, fitness level, and available equipment.",
      icon: "💪",
      color: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
      iconBg: "bg-indigo-100 text-indigo-700",
      badge: memberProfile?.workouts.find((w) => w.isAiGenerated) ? "Used" : null,
    },
    {
      href: `ai/nutrition`,
      title: "AI Nutrition Coach",
      description: "Get a personalised Nigerian meal plan tailored to your calorie needs, diet goal, and local food preferences.",
      icon: "🥗",
      color: "bg-green-50 border-green-200 hover:border-green-400",
      iconBg: "bg-green-100 text-green-700",
      badge: memberProfile?.mealPlans.find((m) => m.isAiGenerated) ? "Used" : null,
    },
    {
      href: `ai/progress`,
      title: "AI Progress Analyzer",
      description: "Get an in-depth AI analysis of your fitness progress, trends, and personalised recommendations.",
      icon: "📊",
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
      iconBg: "bg-purple-100 text-purple-700",
      badge: memberProfile?.progressRecords.length ? `${memberProfile.progressRecords.length} records` : null,
    },
    {
      href: `ai/chat`,
      title: "AI Chat Coach",
      description: "Chat with your personal AI fitness coach. Ask anything about workouts, nutrition, recovery, or motivation.",
      icon: "🤖",
      color: "bg-orange-50 border-orange-200 hover:border-orange-400",
      iconBg: "bg-orange-100 text-orange-700",
      badge: "Always available",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Fitness Assistant</h1>
        <p className="text-gray-500 mt-1">
          Powered by Google Gemini AI — your personal coach available 24/7
        </p>
      </div>

      <div className="bg-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🤖</span>
          <div>
            <p className="font-bold text-lg">Meet Your AI Coach</p>
            <p className="text-indigo-200 text-sm">
              Personalised to your profile, goals, and Nigerian lifestyle
            </p>
          </div>
        </div>
        <p className="text-indigo-100 text-sm leading-relaxed">
          Your AI coach knows your fitness goals, weight, height, workout history, and progress records.
          It generates plans using Nigerian foods and adapts recommendations to your specific needs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <Link
            key={f.href}
            href={`/gym/${slug}/dashboard/member/${f.href}`}
            className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${f.color}`}
          >
            {f.badge && (
              <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {f.badge}
              </span>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${f.iconBg}`}>
              {f.icon}
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
