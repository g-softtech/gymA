import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MemberProgressView from "@/components/member/MemberProgressView";

export default async function MemberProgressPage({
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
      progressRecords: {
        orderBy: { recordedAt: "asc" },
      },
    },
  });
  if (!memberProfile) return null;

  const records = memberProfile?.progressRecords ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Progress</h1>
        <p className="text-muted-foreground mt-1">Track your fitness journey over time</p>
      </div>
      <MemberProgressView
        records={records.map((r) => ({
          id: r.id,
          weightKg: r.weightKg,
          bodyFatPct: r.bodyFatPct,
          muscleMass: r.muscleMass,
          chestCm: r.chestCm,
          waistCm: r.waistCm,
          hipsCm: r.hipsCm,
          notes: r.notes ?? "",
          recordedAt: r.recordedAt.toISOString(),
        }))}
      />
    </div>
  );
}
