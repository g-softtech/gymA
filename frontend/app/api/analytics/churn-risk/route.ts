import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateChurnRisk } from "@/lib/analytics";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch members and their active subscriptions
    const members = await prisma.memberProfile.findMany({
      where: { user: { tenantId } },
      include: {
        user: { select: { name: true, email: true } },
        subscriptions: { where: { status: "ACTIVE" } }
      }
    });

    // Batch fetch attendances
    const attendances = await prisma.attendance.findMany({
      where: { tenantId, checkInTime: { gte: sixtyDaysAgo } }
    });

    // Batch fetch recent bookings to detect NO_SHOWs
    const bookings = await prisma.booking.findMany({
      where: { tenantId, date: { gte: thirtyDaysAgo } }
    });

    const atRiskMembers: any[] = [];

    // Evaluate churn risk in memory
    for (const member of members) {
      const hasActiveSub = member.subscriptions.length > 0;
      
      const memberAttendances = attendances.filter(a => a.memberId === member.id);
      const last30 = memberAttendances.filter(a => new Date(a.checkInTime) >= thirtyDaysAgo);
      const prev30 = memberAttendances.filter(a => new Date(a.checkInTime) < thirtyDaysAgo);
      const memberBookings = bookings.filter(b => b.memberId === member.id);

      const { risk, reasons } = calculateChurnRisk(last30, prev30, memberBookings, hasActiveSub);

      if (risk === "HIGH" || risk === "MEDIUM") {
        atRiskMembers.push({
          memberId: member.id,
          name: member.user.name,
          email: member.user.email,
          churnRisk: risk,
          reasons,
          hasActiveSub
        });
      }
    }

    // Sort: HIGH risk first
    atRiskMembers.sort((a, b) => a.churnRisk === "HIGH" ? -1 : 1);

    return NextResponse.json(atRiskMembers);

  } catch (error) {
    console.error("Churn Risk Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
