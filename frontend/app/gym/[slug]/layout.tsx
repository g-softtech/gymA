import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { notFound, redirect } from "next/navigation";
import { recordMetric } from "@/lib/billing/revenueMetrics";
import { subscriptionEventBus } from "@/lib/events/subscriptionEventBus";

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

  return (
    <TenantThemeProvider settings={tenant.settings} tenantName={tenant.name}>
      {children}
    </TenantThemeProvider>
  );
}