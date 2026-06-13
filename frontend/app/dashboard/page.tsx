import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardRouter() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // SuperAdmin goes to global admin panel
  if (session.user.role === "SUPERADMIN") {
    redirect("/admin");
  }

  // If user has a tenant, redirect them to their gym's dashboard
  if (session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true }
    });

    if (tenant) {
      if (session.user.role === "ADMIN" || session.user.role === "TRAINER") {
        redirect(`/gym/${tenant.slug}/dashboard/admin`);
      } else {
        redirect(`/gym/${tenant.slug}/dashboard/member`);
      }
    }
  }

  // If no tenant, they need to onboard
  redirect("/onboarding");
}