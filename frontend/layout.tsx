import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenant: string };
}) {
  // Additional validation or data fetching for the dashboard shell can go here
  // e.g., validating the user's session and checking if they belong to this tenant

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Sidebar/Top Navigation Placeholder */}
      <header className="w-full bg-white p-4 shadow-sm">Dashboard Header - {params.tenant}</header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}