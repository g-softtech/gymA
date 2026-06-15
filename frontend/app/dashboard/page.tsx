import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardRouter() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  // SUPERADMIN -> /admin
  if (session.user.role === "SUPERADMIN") {
    redirect("/admin");
  }

  // If user has a tenant, redirect them to their gym's dashboard based on role
  if (session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true }
    });

    if (tenant) {
      if (session.user.role === "ADMIN") {
        redirect(`/gym/${tenant.slug}/dashboard/admin`);
      } else if (session.user.role === "TRAINER") {
        redirect(`/gym/${tenant.slug}/dashboard/trainer`);
      } else if (session.user.role === "STAFF") { // Future proofing
        redirect(`/gym/${tenant.slug}/dashboard/staff`);
      } else {
        redirect(`/gym/${tenant.slug}/dashboard/member`);
      }
    }
  }

  // Authenticated user without tenant -> /onboarding
  redirect("/onboarding");
}