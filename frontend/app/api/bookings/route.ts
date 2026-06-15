import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// GET /api/bookings
export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const whereClause: any = { tenantId };

    // Members see their own bookings. Admins/Trainers can see all (or filtered).
    if (session.user.role === "MEMBER") {
      const profile = await prisma.memberProfile.findUnique({ where: { userId: session.user.id } });
      if (!profile) return NextResponse.json({ bookings: [] });
      whereClause.memberId = profile.id;
    } else if (session.user.role === "TRAINER") {
      const profile = await prisma.trainerProfile.findUnique({ where: { userId: session.user.id } });
      if (!profile) return NextResponse.json({ bookings: [] });
      whereClause.trainerId = profile.id;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        trainer: { include: { user: { select: { name: true, image: true } } } },
        classSession: { include: { instructor: { include: { user: { select: { name: true } } } } } },
        member: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized. You must be signed in to book." }, { status: 401 });
    }

    const body = await req.json();
    const { classSessionId, trainerId, date, notes } = body;

    if (!classSessionId && !trainerId) {
      return NextResponse.json({ error: "Must provide classSessionId or trainerId" }, { status: 400 });
    }

    const tenantId = session.user.tenantId;

    // Ensure user has a MemberProfile
    let memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!memberProfile) {
      // Auto-create profile if missing
      memberProfile = await prisma.memberProfile.create({
        data: { userId: session.user.id }
      });
    }

    // ── Phase 15: Membership Enforcement ──────────────────────────────────────
    const activeSub = await prisma.subscription.findFirst({
      where: {
        memberId: memberProfile.id,
        tenantId,
        status: "ACTIVE",
        endDate: { gt: new Date() }
      }
    });

    if (!activeSub) {
      return NextResponse.json({ error: "Active membership required to book" }, { status: 403 });
    }

    const MAX_RETRIES = 3;
    
    // Active bookings filter (lazy eviction)
    const activeBookingCondition = {
      OR: [
        { status: "CONFIRMED" },
        { status: "PENDING", paymentExpiresAt: { gte: new Date() } },
        { status: "PENDING", paymentExpiresAt: null }
      ]
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. CLASS BOOKING
          if (classSessionId) {
            const classSession = await tx.classSession.findUnique({
              where: { id: classSessionId },
              // Phase 15 lazy eviction: only count CONFIRMED or valid PENDING
              include: { _count: { select: { bookings: { where: activeBookingCondition as any } } } }
            });

            if (!classSession || classSession.tenantId !== tenantId) {
              throw new Error("Class not found"); // Handled as 404 below
            }

            if (classSession._count.bookings >= classSession.capacity) {
              throw new Error("Class is fully booked");
            }

            const existing = await tx.booking.findFirst({
              where: { classSessionId, memberId: memberProfile!.id, ...activeBookingCondition as any }
            });

            if (existing) {
              throw new Error("You are already booked for this class");
            }

            const isFree = !classSession.price || Number(classSession.price) === 0;

            return await tx.booking.create({
              data: {
                tenantId,
                memberId: memberProfile!.id,
                classSessionId,
                date: classSession.startTime,
                durationMins: classSession.durationMins,
                notes,
                status: isFree ? "CONFIRMED" : "PENDING",
                paymentRequired: !isFree,
                paymentStatus: isFree ? "SUCCESS" : "PENDING",
                paymentAmount: isFree ? null : classSession.price,
                paymentExpiresAt: isFree ? null : new Date(Date.now() + 15 * 60000)
              }
            });
          }

          // 2. TRAINER BOOKING (1-on-1)
          if (trainerId && date) {
            const targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
              throw new Error("Invalid date");
            }

            // CRITICAL FIX: Verify trainer exists AND belongs to the tenant
            const trainer = await tx.trainerProfile.findFirst({ 
              where: { 
                id: trainerId,
                user: { tenantId: tenantId }
              } 
            });
            if (!trainer) throw new Error("Trainer not found"); // Returns 404

            const startMs = targetDate.getTime();
            const durationMins = 60;
            const endMs = startMs + (durationMins * 60000);

            const startOfDay = new Date(targetDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const existingBookings = await tx.booking.findMany({
              where: {
                trainerId,
                ...activeBookingCondition as any,
                date: { gte: startOfDay, lte: endOfDay }
              }
            });

            const hasConflict = existingBookings.some(b => {
              const bStart = b.date.getTime();
              const bEnd = bStart + (b.durationMins * 60000);
              return (startMs < bEnd && endMs > bStart);
            });

            if (hasConflict) {
              throw new Error("This slot is no longer available");
            }

            const isFree = !trainer.hourlyRate || Number(trainer.hourlyRate) === 0;

            return await tx.booking.create({
              data: {
                tenantId,
                memberId: memberProfile!.id,
                trainerId,
                date: targetDate,
                durationMins,
                notes,
                status: isFree ? "CONFIRMED" : "PENDING",
                paymentRequired: !isFree,
                paymentStatus: isFree ? "SUCCESS" : "PENDING",
                paymentAmount: isFree ? null : trainer.hourlyRate,
                paymentExpiresAt: isFree ? null : new Date(Date.now() + 15 * 60000)
              }
            });
          }
          
          throw new Error("Invalid payload");
        }, { isolationLevel: "Serializable" });

        return NextResponse.json({ message: "Booking successful", booking: result });

      } catch (err: any) {
        // Handle serialization failure (P2034)
        if (err.code === "P2034") {
          if (attempt === MAX_RETRIES - 1) {
            return NextResponse.json({ error: "This slot was just taken by another member. Please choose a different time." }, { status: 409 });
          }
          // Randomized backoff: 50ms - 200ms
          const backoff = Math.floor(Math.random() * 150) + 50;
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }

        // Forward normal app errors
        if (err.message === "Class not found" || err.message === "Trainer not found") {
          return NextResponse.json({ error: err.message }, { status: 404 });
        }
        if (["Class is fully booked", "You are already booked for this class", "Invalid date", "This slot is no longer available", "Invalid payload"].includes(err.message)) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }

        throw err;
      }
    }

  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
