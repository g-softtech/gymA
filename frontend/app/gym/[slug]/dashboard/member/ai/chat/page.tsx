import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AIChatCoach from "@/components/ai/AIChatCoach";

export default async function AIChatPage({
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
      progressRecords: { orderBy: { recordedAt: "desc" }, take: 1 },
      workouts: { orderBy: { createdAt: "desc" }, take: 2 },
      mealPlans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!memberProfile) return null;

  const systemContext = `You are a professional fitness and nutrition coach for a Nigerian gym member.
Member profile:
- Weight: ${memberProfile?.weightKg ?? "unknown"}kg
- Height: ${memberProfile?.heightCm ?? "unknown"}cm  
- Fitness goals: ${memberProfile?.fitnessGoals?.join(", ") || "general fitness"}
- Latest progress: ${memberProfile?.progressRecords[0] ? `weight ${memberProfile.progressRecords[0].weightKg}kg` : "no records yet"}
- Active workout plans: ${memberProfile?.workouts.length ?? 0}

You specialise in Nigerian fitness culture and nutrition. When giving nutrition advice, 
reference Nigerian foods like jollof rice, egusi soup, moin moin, suya, pounded yam, etc.
Be encouraging, specific, and practical. Keep responses concise and actionable.`;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Chat Coach</h1>
        <p className="text-muted-foreground mt-1">
          Ask your AI coach anything about fitness, nutrition, or recovery
        </p>
      </div>
      <AIChatCoach
        userName={session.user.name ?? "there"}
        systemContext={systemContext}
      />
    </div>
  );
}
