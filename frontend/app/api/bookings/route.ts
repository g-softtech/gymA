import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId derived from server session — never from request body
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { trainerId, date, durationMins, sessionType, notes } = await req.json();

    if (!trainerId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate sessionType
    const validSessionTypes = ["PHYSICAL", "ONLINE"];
    const finalSessionType = validSessionTypes.includes(sessionType)
      ? sessionType
      : "PHYSICAL";

    let memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!memberProfile) {
      memberProfile = await prisma.memberProfile.create({
        data: { userId: session.user.id, fitnessGoals: [] },
      });
    }

    const bookingDate = new Date(date);
    const bookingEnd = new Date(bookingDate.getTime() + (durationMins ?? 60) * 60000);

    // ✅ Conflict check now scoped to the same tenant — prevents cross-tenant phantom conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        trainerId,
        tenantId: ctx.tenantId,
        status: { in: ["PENDING", "CONFIRMED"] },
        date: {
          gte: new Date(bookingDate.getTime() - 60 * 60000),
          lte: bookingEnd,
        },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Trainer is not available at this time. Please choose a different slot." },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        trainerId,
        memberId: memberProfile.id,
        tenantId: ctx.tenantId, // ✅ from session
        date: bookingDate,
        durationMins: durationMins ?? 60,
        sessionType: finalSessionType,
        status: "PENDING",
        notes,
      },
    });

    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      include: { user: true },
    });

    if (trainer) {
      await prisma.notification.create({
        data: {
          tenantId: ctx.tenantId,
          userId: trainer.userId,
          type: "BOOKING",
          title: "New Booking Request",
          message: `You have a new ${finalSessionType.toLowerCase()} session request for ${new Date(date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })} at ${new Date(date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`,
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
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

    // ✅ tenantId from session — query param tenantId is ignored
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const bookings = await prisma.booking.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        trainer: { include: { user: { select: { name: true, email: true } } } },
        member: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
