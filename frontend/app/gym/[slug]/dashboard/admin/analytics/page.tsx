import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { SubscriptionAnalyticsRepository } from "@/lib/subscriptions/analytics/subscriptionAnalyticsRepository";
import { SubscriptionAnalyticsService } from "@/lib/subscriptions/analytics/subscriptionAnalyticsService";
import { systemClock } from "@/lib/time/SystemClock";
import { TrendGranularity } from "@/lib/subscriptions/analytics/types";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";

export default async function AnalyticsDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) notFound();

  const sp = await searchParams;

  // Defaults: Last 30 Days
  const now = systemClock.now();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const fromStr = typeof sp.from === "string" ? sp.from : thirtyDaysAgo.toISOString();
  const toStr = typeof sp.to === "string" ? sp.to : now.toISOString();
  
  let granularity: TrendGranularity = "day";
  if (sp.granularity === "week" || sp.granularity === "month") {
    granularity = sp.granularity as TrendGranularity;
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  // Initialize service
  const repository = new SubscriptionAnalyticsRepository(systemClock);
  const service = new SubscriptionAnalyticsService(repository, systemClock);

  // Fetch DTO
  const metrics = await service.getDashboardMetrics(tenant.id, from, to, granularity);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Deep insights into subscription performance and revenue health.
        </p>
      </div>

      <AnalyticsDashboardClient initialMetrics={metrics} tenantSlug={slug} />
    </div>
  );
}
