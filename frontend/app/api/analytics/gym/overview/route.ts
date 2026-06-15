import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEngagementScore, calculateChurnRisk } from "@/lib/analytics";
import { analyticsCache } from "@/lib/cache";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Check Cache
    const cacheKey = `tenant:${tenantId}:overview`;
    const cachedResponse = analyticsCache.get(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch members
    const members = await prisma.memberProfile.findMany({
      where: { user: { tenantId } },
      include: { subscriptions: { where: { status: "ACTIVE" } } }
    });

    const activeMembers = members.filter(m => m.subscriptions.length > 0);

    // Batch fetch attendances
    const attendances = await prisma.attendance.findMany({
      where: { tenantId, checkInTime: { gte: sixtyDaysAgo } }
    });

    // Batch fetch bookings
    const bookings = await prisma.booking.findMany({
      where: { tenantId, date: { gte: thirtyDaysAgo } }
    });

    let totalEngagement = 0;
    let maxEngagementScore = 0;
    const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };

    for (const member of activeMembers) {
      const memberAttendances = attendances.filter(a => a.memberId === member.id);
      const last30 = memberAttendances.filter(a => new Date(a.checkInTime) >= thirtyDaysAgo);
      const prev30 = memberAttendances.filter(a => new Date(a.checkInTime) < thirtyDaysAgo);
      const memberBookings = bookings.filter(b => b.memberId === member.id);

      // Active months approx
      const activeMonths = Math.max(1, Math.round((now.getTime() - member.subscriptions[0].startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

      const rawEngagementScore = calculateEngagementScore(last30, memberBookings, activeMonths);
      totalEngagement += rawEngagementScore;
      if (rawEngagementScore > maxEngagementScore) {
        maxEngagementScore = rawEngagementScore;
      }

      const { risk } = calculateChurnRisk(last30, prev30, memberBookings, true);
      riskDistribution[risk]++;
    }

    const rawAverageScore = activeMembers.length > 0 ? Math.round(totalEngagement / activeMembers.length) : 0;
    const averageEngagementScore = maxEngagementScore > 0 ? Math.round((rawAverageScore / maxEngagementScore) * 100) : rawAverageScore;

    // Cache the max score for member profile normalization
    analyticsCache.set(`tenant:${tenantId}:maxEngagement`, maxEngagementScore, 60);

    const response = {
      totalActiveMembers: activeMembers.length,
      averageEngagementScore,
      riskDistribution,
      totalMembers: members.length
    };

    analyticsCache.set(cacheKey, response, 60);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Overview Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
