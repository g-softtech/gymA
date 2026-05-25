
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) notFound();

  // User has no tenant assigned yet — assign them to this tenant and redirect back
  if (!session.user.tenantId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { tenantId: tenant.id },
    });
    // Force session refresh by redirecting through signIn
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`);
  }

  // User belongs to a different tenant
  if (session.user.tenantId !== tenant.id) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You do not have access to {tenant.name}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="w-full bg-white px-6 py-4 shadow-sm flex justify-between items-center">
        <span className="font-semibold text-lg text-gray-900">{tenant.name}</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user.email}</span>
          <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
            {session.user.role}
          </span>
          <a href="/api/auth/signout" className="text-sm text-red-500 hover:underline">
            Sign out
          </a>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
