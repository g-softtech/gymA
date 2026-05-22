import { ReactNode } from "react";
import { prisma } from "../../../lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "../../../lib/auth";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const resolvedParams = await params;
  const session = await getAuthSession();

  // Basic protection: Ensure user is logged in
  if (!session || !session.user) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${resolvedParams.tenant}/dashboard/member`);
  }

  // Verify the tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { slug: resolvedParams.tenant },
  });

  if (!tenant) {
    notFound();
  }

  // ENFORCE TENANT DATA ISOLATION: User must belong to this specific gym
  if (session.user.tenantId !== tenant.id) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-red-600">
        <h2 className="text-2xl font-bold">Unauthorized: You do not have access to {tenant.name}</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="w-full bg-white p-4 shadow-sm flex justify-between items-center">
        <span className="font-semibold text-lg">{tenant.name} Dashboard</span>
        <span className="text-sm text-gray-500">Logged in as: {session.user.role}</span>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}