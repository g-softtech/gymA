import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TrainerManager from "@/components/admin/TrainerManager";

export default async function AdminTrainersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) redirect(`/api/auth/signin`);
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    return <p className="p-6 text-red-600 font-semibold">Access Denied.</p>;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      users: {
        where: { role: "TRAINER" },
        include: {
          trainerProfile: {
            include: {
              bookings: { where: { status: { not: "CANCELLED" } } },
            },
          },
        },
      },
    },
  });

  if (!tenant) return <p>Gym not found.</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
        <p className="text-gray-500 mt-1">
          {tenant.users.length} trainer{tenant.users.length !== 1 ? "s" : ""} at {tenant.name}
        </p>
      </div>
      <TrainerManager
        tenantId={tenant.id}
        trainers={tenant.users.map((u) => ({
          id: u.id,
          name: u.name ?? "—",
          email: u.email ?? "—",
          specialties: u.trainerProfile?.specialties ?? [],
          bio: u.trainerProfile?.bio ?? "",
          hourlyRate: u.trainerProfile?.hourlyRate ?? null,
          totalBookings: u.trainerProfile?.bookings?.length ?? 0,
          hasProfile: !!u.trainerProfile,
        }))}
      />
    </div>
  );
}
