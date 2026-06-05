import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, tenantId, note } = await req.json();

    // Only admins and trainers can check in members manually
    if (session.user.role === "MEMBER") {
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!profile || profile.id !== memberId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get member name for notification
    const memberProfile = await prisma.memberProfile.findUnique({
      where: { id: memberId },
      include: { user: { select: { name: true, email: true } } },
    });

    const memberName = memberProfile?.user.name ?? memberProfile?.user.email ?? "A member";

    const attendance = await prisma.attendance.create({
      data: { memberId, tenantId, note },
    });

    // Notify ADMINS only (not the member themselves)
    const admins = await prisma.user.findMany({
      where: { tenantId, role: { in: ["ADMIN", "SUPERADMIN"] } },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            tenantId,
            userId: admin.id,
            type: "ATTENDANCE",
            title: "Member Check-in",
            message: `${memberName} checked in at ${new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`,
          },
        })
      )
    );

    return NextResponse.json(attendance, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    }

    const records = await prisma.attendance.findMany({
      where: { tenantId },
      include: {
        member: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { checkedInAt: "desc" },
      take: 100,
    });

    return NextResponse.json(records);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
