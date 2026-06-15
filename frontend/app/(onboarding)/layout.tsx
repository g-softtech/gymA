import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();

  if (session?.user) {
    // Super Admin -> Start Free Trial -> Redirect to /admin
    if (session.user.role === "SUPERADMIN") {
      redirect("/admin");
    }

    // Logged-in user with existing gym -> Redirect directly to their gym dashboard
    if (session.user.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId }
      });
      
      if (tenant) {
        redirect("/dashboard"); // Global router handles role-based routing
      }
    }
  }

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-black via-gray-900 to-indigo-950 text-white selection:bg-indigo-500/30 flex items-center justify-center p-4">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {children}
      </div>
    </div>
  );
}
