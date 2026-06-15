import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEngagementScore, calculateChurnRisk, calculateLTV } from "@/lib/analytics";
import { analyticsCache } from "@/lib/cache";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const cacheKey = `tenant:${tenantId}:member:${id}`;
    const cachedResponse = analyticsCache.get(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const member = await prisma.memberProfile.findUnique({
      where: { id, user: { tenantId } },
      include: {
        user: { select: { name: true, email: true } },
        subscriptions: { where: { status: "ACTIVE" } },
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Run aggregations concurrently
    const [attendancesLast30, attendancesPrev30, bookings, transactions] = await Promise.all([
      prisma.attendance.findMany({
        where: { memberId: id, tenantId, checkInTime: { gte: thirtyDaysAgo } }
      }),
      prisma.attendance.findMany({
        where: { memberId: id, tenantId, checkInTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
      }),
      prisma.booking.findMany({
        where: { memberId: id, tenantId, date: { gte: thirtyDaysAgo } }
      }),
      prisma.transaction.findMany({
        where: { memberId: id, tenantId, status: "SUCCESS" }
      })
    ]);

    const activeMonths = member.subscriptions.length > 0 
      ? Math.max(1, Math.round((now.getTime() - member.subscriptions[0].startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
      : 1;

    // Calculate Engagement Score
    const rawEngagementScore = calculateEngagementScore(attendancesLast30, bookings, activeMonths);
    const rawPrevEngagementScore = calculateEngagementScore(attendancesPrev30, [], activeMonths); // Approximate previous

    // Apply Min-Max Normalization
    const tenantMaxScore = analyticsCache.get<number>(`tenant:${tenantId}:maxEngagement`) || 0;
    const engagementScore = tenantMaxScore > 0 ? Math.round((rawEngagementScore / tenantMaxScore) * 100) : rawEngagementScore;
    const prevEngagementScore = tenantMaxScore > 0 ? Math.round((rawPrevEngagementScore / tenantMaxScore) * 100) : rawPrevEngagementScore;

    const trend = engagementScore > prevEngagementScore + 5 ? "UP" : engagementScore < prevEngagementScore - 5 ? "DOWN" : "STABLE";

    // Calculate Churn Risk
    const hasActiveSub = member.subscriptions.length > 0;
    const { risk: riskLevel, reasons } = calculateChurnRisk(attendancesLast30, attendancesPrev30, bookings, hasActiveSub);

    // Calculate LTV
    const { totalSpent, predictedLtv } = calculateLTV(transactions, engagementScore);

    const response = {
      memberId: id,
      name: member.user.name,
      engagementScore,
      trend,
      riskLevel,
      churnReasons: reasons,
      totalSpent,
      predictedLifetimeValue: predictedLtv,
      metrics: {
        attendancesLast30: attendancesLast30.length,
        bookingsLast30: bookings.length
      }
    };

    analyticsCache.set(cacheKey, response, 60);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Member Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
