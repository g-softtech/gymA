import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession } from "@/lib/tenant";
import { getMRR, getRevenueByPlan, getChurnRate, getAverageRevenuePerMember, getRevenueTrend } from "@/lib/analytics/revenue-analytics";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantContext = await getTenantContextFromSession(session);
    if (!tenantContext) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    const tenantId = tenantContext.tenantId;

    const [mrr, revenueByPlan, churnRate, arpu, trend] = await Promise.all([
      getMRR(tenantId),
      getRevenueByPlan(tenantId),
      getChurnRate(tenantId),
      getAverageRevenuePerMember(tenantId),
      getRevenueTrend(tenantId),
    ]);

    return NextResponse.json({
      data: { mrr, revenueByPlan, churnRate, arpu, trend }
    });
  } catch (error) {
    console.error("[Revenue Analytics API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
