import { NextRequest, NextResponse } from "next/server";
import { systemClock } from "@/lib/time/SystemClock";
import { SubscriptionAnalyticsRepository } from "@/lib/subscriptions/analytics/subscriptionAnalyticsRepository";
import { SubscriptionAnalyticsService } from "@/lib/subscriptions/analytics/subscriptionAnalyticsService";
import { TrendGranularity } from "@/lib/subscriptions/analytics/types";

// In a real app, this would be wrapped with authorization to ensure the user is an admin of the tenant.
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    const granularityStr = searchParams.get("granularity");

    // 1. Validation: Required fields
    if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    if (!fromStr) return NextResponse.json({ error: "Missing 'from' date" }, { status: 400 });
    if (!toStr) return NextResponse.json({ error: "Missing 'to' date" }, { status: 400 });
    if (!granularityStr) return NextResponse.json({ error: "Missing 'granularity'" }, { status: 400 });

    // 2. Validation: Dates
    const from = new Date(fromStr);
    const to = new Date(toStr);

    if (isNaN(from.getTime())) return NextResponse.json({ error: "Invalid 'from' date" }, { status: 400 });
    if (isNaN(to.getTime())) return NextResponse.json({ error: "Invalid 'to' date" }, { status: 400 });
    
    if (from > to) {
      return NextResponse.json({ error: "'from' date cannot be after 'to' date" }, { status: 400 });
    }

    // 3. Validation: Granularity
    const validGranularities: TrendGranularity[] = ["day", "week", "month"];
    const granularity = granularityStr.toLowerCase() as TrendGranularity;
    
    if (!validGranularities.includes(granularity)) {
      return NextResponse.json({ 
        error: `Invalid granularity: ${granularityStr}. Must be one of: ${validGranularities.join(", ")}` 
      }, { status: 400 });
    }

    // Initialize dependencies
    const repository = new SubscriptionAnalyticsRepository(systemClock);
    const service = new SubscriptionAnalyticsService(repository, systemClock);

    // Fetch metrics
    const metrics = await service.getDashboardMetrics(tenantId, from, to, granularity);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[GET /api/analytics/subscriptions] Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
