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
    
    const cacheKey = `tenant:${tenantId}:heatmap`;
    const cachedResponse = analyticsCache.get(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    // Last 90 days constraint
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // CRITICAL PERFORMANCE REQUIREMENT:
    // Raw SQL aggregation per user spec to strictly avoid Node.js memory bloat.
    // Grouping happens fully inside Postgres.
    const result = await prisma.$queryRaw<
      { dayofweek: number; hourofday: number; attendancecount: bigint }[]
    >`
      SELECT 
        EXTRACT(ISODOW FROM "checkInTime")::int AS dayOfWeek,
        EXTRACT(HOUR FROM "checkInTime")::int AS hourOfDay,
        COUNT(*)::bigint AS attendanceCount
      FROM "Attendance"
      WHERE "tenantId" = ${tenantId}
        AND "checkInTime" >= ${ninetyDaysAgo}
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2 ASC;
    `;

    // Format output: Guarantee a complete 7 x 24 matrix (number[7][24])
    // ISODOW: 1 = Monday, 7 = Sunday
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const row of result) {
      const dayIndex = Number(row.dayofweek) - 1; // 0 = Monday, 6 = Sunday
      const hourIndex = Number(row.hourofday); // 0-23
      if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 24) {
        matrix[dayIndex][hourIndex] = Number(row.attendancecount);
      }
    }

    const response = { heatmap: matrix };
    analyticsCache.set(cacheKey, response, 60);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Heatmap Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
