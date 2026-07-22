import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BookTrainerClient from "./BookTrainerClient";

export const metadata = {
  title: "Book a Trainer | Member Dashboard",
};

export default async function BookTrainerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/gym/${slug}/login`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) return <p>Gym not found.</p>;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile) {
    redirect(`/gym/${slug}/dashboard/member`);
  }

  // Fetch all trainers in this gym who have a profile and are set to show on website
  const trainers = await prisma.user.findMany({
    where: {
      tenantId: tenant.id,
      role: "TRAINER",
      trainerProfile: {
        showOnWebsite: true,
      }
    },
    include: {
      trainerProfile: true,
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book a Trainer</h1>
          <p className="text-muted-foreground mt-1">Browse our expert trainers and schedule your next 1-on-1 session.</p>
        </div>
      </div>

      <BookTrainerClient 
        tenantId={tenant.id} 
        memberId={profile.id} 
        trainers={trainers.map(t => ({
          id: t.id,
          name: t.name ?? "Trainer",
          email: t.email ?? "",
          profileId: t.trainerProfile!.id,
          specialties: t.trainerProfile!.specialties,
          bio: t.trainerProfile!.bio,
          hourlyRate: Number(t.trainerProfile!.hourlyRate),
          title: t.trainerProfile!.title,
          yearsOfExperience: t.trainerProfile!.yearsOfExperience,
          publicPhotoUrl: t.trainerProfile!.publicPhotoUrl,
          availability: (t.trainerProfile!.availability as Record<string, string[]>) || {},
        }))} 
      />
    </div>
  );
}
