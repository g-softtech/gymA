import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { notFound, redirect } from "next/navigation";
import { recordMetric } from "@/lib/billing/revenueMetrics";
import { subscriptionEventBus } from "@/lib/events/subscriptionEventBus";
import { isDemoTenant } from "@/lib/tenant";
import { DemoCTA } from "@/components/demo/DemoCTA";
export default async function GymLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { settings: true }
  });

  if (!tenant) {
    notFound();
  }

  const BLOCKED_STATUSES = ["PAST_DUE", "SUSPENDED", "EXPIRED"];
  if (tenant.billingStatus && BLOCKED_STATUSES.includes(tenant.billingStatus)) {
    recordMetric("blockedAccess");
    subscriptionEventBus.emit("REVENUE_BLOCKED_ACCESS", {
      tenantId: tenant.id,
      timestamp: Date.now(),
    });
    redirect("/billing/blocked");
  }

  const isDemo = isDemoTenant(tenant);

  return (
    <TenantThemeProvider settings={tenant.settings} tenantName={tenant.name}>
      {isDemo && (
        <div className="bg-amber-500/10 text-amber-500 border-b border-amber-500/20 py-2 px-4 text-center text-sm font-semibold z-[100] relative flex items-center justify-center gap-2 shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Live Demo &bull; Sample Data &bull; Changes are not saved
        </div>
      )}
      {children}
      {isDemo && <DemoCTA />}
    </TenantThemeProvider>
  );
}