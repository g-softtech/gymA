import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileEditor from "@/components/member/ProfileEditor";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) redirect(`/api/auth/signin`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { memberProfile: true },
  });

  if (!user) redirect(`/gym/${slug}/dashboard/member`);

  // Auto-create profile if missing
  if (!user.memberProfile) {
    await prisma.memberProfile.create({
      data: { userId: user.id, fitnessGoals: [] },
    });
  }

  const profile = user.memberProfile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and fitness goals</p>
      </div>
      <ProfileEditor
        userId={user.id}
        initialData={{
          name: user.name ?? "",
          email: user.email ?? "",
          weightKg: profile?.weightKg ?? null,
          heightCm: profile?.heightCm ?? null,
          fitnessGoals: profile?.fitnessGoals ?? [],
        }}
      />
    </div>
  );
}
