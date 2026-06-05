import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// DELETE /api/member/bookings?bookingId=xxx — cancel a booking
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingId = req.nextUrl.searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trainer: true },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.memberId !== memberProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // Notify trainer
    await prisma.notification.create({
      data: {
        tenantId: booking.tenantId,
        userId: booking.trainer.userId,
        type: "BOOKING",
        title: "Booking Cancelled",
        message: `A member cancelled their session on ${new Date(booking.date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
