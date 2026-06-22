import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession } from "@/lib/tenant";
import { getActiveMembers, getNewMembers, getMembersByPlan, getRetentionRate } from "@/lib/analytics/membership-analytics";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantContext = await getTenantContextFromSession(session);
    if (!tenantContext) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    const tenantId = tenantContext.tenantId;

    const [active, newMembers, byPlan, retention] = await Promise.all([
      getActiveMembers(tenantId),
      getNewMembers(tenantId),
      getMembersByPlan(tenantId),
      getRetentionRate(tenantId),
    ]);

    return NextResponse.json({
      data: { active, newMembers, byPlan, retention }
    });
  } catch (error) {
    console.error("[Membership Analytics API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
