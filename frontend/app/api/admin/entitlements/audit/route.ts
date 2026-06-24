import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getTenantContextFromSession(session);
    if (!tenantContext) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    const tenantId = tenantContext.tenantId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all plans for the tenant
    const plans = await prisma.membershipPlan.findMany({
      where: { tenantId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
        },
      },
    });

    const result = await Promise.all(
      plans.map(async (plan) => {
        // Blocked Requests this month
        const blockedRequests = 0;

        // Members Hitting Limits (Distinct users who had a blocked request)
        const membersAtLimit = [];

        // Usage This Month (Total requests, both allowed and blocked)
        const usageThisMonth = 0;

        // Last Enforcement Trigger
        const lastLog = null;

        return {
          id: plan.id,
          name: plan.name,
          entitlements: plan.entitlements,
          subscribers: plan.subscriptions.length,
          usageThisMonth,
          membersAtLimit: membersAtLimit.length,
          blockedRequests,
          lastTrigger: lastLog,
        };
      })
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[Entitlements Audit API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
