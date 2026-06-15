import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChallengesManager from "@/components/community/ChallengesManager";

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return null;

  const now = new Date();

  const challenges = await prisma.challenge.findMany({
    where: { tenantId: tenant.id },
    include: {
      entries: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { progress: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fitness Challenges</h1>
        <p className="text-gray-500 mt-1">
          Join challenges, track progress, compete with fellow members
        </p>
      </div>
      <ChallengesManager
        tenantId={tenant.id}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
        challenges={challenges.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type,
          goal: c.goal,
          unit: c.unit,
          startDate: c.startDate.toISOString(),
          endDate: c.endDate.toISOString(),
          isActive: c.startDate <= now && c.endDate >= now,
          entries: c.entries.map((e) => ({
            userId: e.userId,
            userName: e.user.name ?? e.user.email ?? "Member",
            progress: e.progress,
            completed: e.completed,
          })),
          myEntry: (() => {
            const e = c.entries.find((e) => e.userId === session.user.id);
            if (!e) return null;
            return {
              userId: e.userId,
              userName: e.user.name ?? e.user.email ?? "Member",
              progress: e.progress,
              completed: e.completed,
            };
          })(),
        }))}
      />
    </div>
  );
}
