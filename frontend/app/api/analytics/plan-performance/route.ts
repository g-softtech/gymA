import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession } from "@/lib/tenant";
import { getPlanPerformance } from "@/lib/analytics/plan-performance";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantContext = await getTenantContextFromSession(session);
    if (!tenantContext) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const data = await getPlanPerformance(tenantContext.tenantId);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Plan Performance API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
