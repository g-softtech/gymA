import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyticsCache } from "@/lib/cache";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    
    // Attempt to load risk profiles from the Cron Job cache
    let riskProfiles = analyticsCache.get<any[]>(`tenant:${tenantId}:intelligence:risks`);
    
    // If cron hasn't run yet, we return empty arrays with a warning to trigger the cron
    if (!riskProfiles) {
      return NextResponse.json({
        message: "Intelligence Engine is warming up. Please wait for the next cron cycle or manually trigger it.",
        atRiskMembers: [],
        summary: {
          totalAtRisk: 0,
          highRisk: 0,
          mediumRisk: 0
        }
      });
    }

    const atRiskMembers = riskProfiles.map(r => ({
      memberId: r.memberId,
      stage: r.stage,
      churnRiskScore: r.churnRiskScore,
      engagementScore: r.engagementScore
    }));

    // Sort by highest risk
    atRiskMembers.sort((a, b) => b.churnRiskScore - a.churnRiskScore);

    return NextResponse.json({
      atRiskMembers,
      summary: {
        totalAtRisk: atRiskMembers.length,
        highRisk: atRiskMembers.filter(r => r.churnRiskScore > 60).length,
        mediumRisk: atRiskMembers.filter(r => r.churnRiskScore >= 30 && r.churnRiskScore <= 60).length
      }
    });

  } catch (error) {
    console.error("Intelligence Overview Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
