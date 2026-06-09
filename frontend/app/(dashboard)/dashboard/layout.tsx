/**
 * DEPRECATED: This legacy dashboard route (/dashboard) has been superseded
 * by the multi-tenant slug-based route (/gym/[slug]/dashboard).
 *
 * This layout now redirects all users to the correct route.
 * Phase 4 (task 4.19) will remove this directory entirely.
 */
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DeprecatedDashboardLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tenant: { select: { slug: true } } },
  });

  if (!user) {
    redirect("/api/auth/signin");
  }

  if (!user.tenantId || !user.tenant?.slug) {
    // No tenant yet — send to onboarding
    redirect("/onboarding");
  }

  // ✅ Redirect to the correct multi-tenant slug-based dashboard
  const role = user.role.toLowerCase();
  redirect(`/gym/${user.tenant.slug}/dashboard/${role}`);
}