import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext, assertMemberBelongsToTenant } from "@/lib/tenant";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId from session — never from request body
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { memberId, note } = await req.json();

    // ✅ Phase 9C: Enforce Tenant boundaries for manual check-ins
    const memberErr = await assertMemberBelongsToTenant(ctx, memberId);
    if (memberErr) return memberErr;

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

    const memberName =
      memberProfile?.user.name ?? memberProfile?.user.email ?? "A member";

    const attendance = await prisma.attendance.create({
      data: { 
        memberId, 
        tenantId: ctx.tenantId, 
        method: "MANUAL",
        type: "GENERAL",
        status: "PRESENT",
        events: note ? {
          create: {
            tenantId: ctx.tenantId,
            memberId,
            eventType: "CHECK_IN_SUCCESS",
            notes: note
          }
        } : undefined
      },
    });

    // Notify ADMINS only (not the member themselves)
    const admins = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId, role: { in: ["ADMIN", "SUPERADMIN"] } },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            tenantId: ctx.tenantId,
            userId: admin.id,
            type: "ATTENDANCE",
            title: "Member Check-in",
            message: `${memberName} checked in at ${new Date().toLocaleTimeString(
              "en-NG",
              { hour: "2-digit", minute: "2-digit" }
            )}`,
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
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId from session — query param is ignored
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const records = await prisma.attendance.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        member: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { checkInTime: "desc" },
      take: 100,
    });

    return NextResponse.json(records);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
