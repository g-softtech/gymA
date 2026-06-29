import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScheduleManager from "@/components/trainer/ScheduleManager";

export default async function TrainerSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      bookings: {
        include: {
          member: { include: { user: { select: { name: true, email: true } } } },
        },
        where: {
          date: { gte: new Date(new Date().setDate(new Date().getDate() - 1)) },
          status: { not: "CANCELLED" },
        },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!trainerProfile) return null;


  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
        <p className="text-muted-foreground mt-1">Manage your availability and upcoming sessions</p>
      </div>
      <ScheduleManager
        trainerId={trainerProfile.id}
        availability={trainerProfile.availability as Record<string, string[]>}
        bookings={trainerProfile.bookings.map((b: any) => ({
          id: b.id,
          memberName: b.member.user.name ?? b.member.user.email ?? "Unknown",
          date: b.date.toISOString(),
          durationMins: b.durationMins,
          sessionType: b.sessionType,
          status: b.status,
          notes: b.notes ?? "",
        }))}
      />
    </div>
  );
}
