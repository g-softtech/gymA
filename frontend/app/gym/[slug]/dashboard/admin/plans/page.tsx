
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlanManager from "@/components/admin/PlanManager";

export default async function ManagePlansPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600 font-semibold">Access Denied — Admins only.</p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { membershipPlans: true },
  });
  if (!tenant) return null;

  if (!tenant) return <p>Gym not found.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
        <p className="text-gray-500 mt-1">Create and manage plans for {tenant.name}</p>
      </div>
      <PlanManager tenantId={tenant.id} slug={slug} initialPlans={tenant.membershipPlans} />
    </div>
  );
}
