import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";

// PATCH /api/bookings/[bookingId] — update booking status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Phase 4: tenantId from session — never trust client-supplied context
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { bookingId } = await params;
    const { status, meetingLink, notes } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trainer: { include: { user: true } },
        member: { include: { user: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ✅ Phase 4: cross-tenant guard — booking must belong to caller's tenant
    if (booking.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only the trainer or admin can update booking status
    const isTrainer = booking.trainer?.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
    const isMember = booking.member.userId === session.user.id;

    if (!isTrainer && !isAdmin && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Members can only cancel
    if (isMember && status !== "CANCELLED") {
      return NextResponse.json({ error: "Members can only cancel bookings" }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(meetingLink && { meetingLink }),
        ...(notes && { notes }),
      },
    });

    // Notify member of status change
    await prisma.notification.create({
      data: {
        tenantId: booking.tenantId,
        userId: booking.member.userId,
        type: "BOOKING",
        title: `Booking ${status}`,
        message: `Your session on ${new Date(booking.date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })} has been ${status.toLowerCase()}.`,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
