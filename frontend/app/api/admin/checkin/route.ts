import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback_secret_for_qr_generation_only"
);

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.email || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    const body = await req.json();
    const { token, memberId: manualMemberId, method, overrideType, bookingId, originalMethod } = body;

    let targetMemberId = manualMemberId;
    let actualMethod = method || "MANUAL";

    // 1. JWT QR Validation
    if (token && method === "QR") {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        if (payload.tenantId !== tenantId) {
          return NextResponse.json({ error: "QR token belongs to a different gym location" }, { status: 403 });
        }

        targetMemberId = payload.memberId as string;
        const nonce = payload.nonce as string;

        const member = await prisma.memberProfile.findUnique({
          where: { id: targetMemberId },
          select: { lastQrNonce: true, qrNonceExpiresAt: true }
        });

        if (!member || member.lastQrNonce !== nonce) {
          return NextResponse.json({ error: "Invalid or reused QR token. Please refresh the QR code." }, { status: 400 });
        }

        if (!member.qrNonceExpiresAt || new Date() > member.qrNonceExpiresAt) {
          return NextResponse.json({ error: "QR token TTL expired. Please refresh." }, { status: 400 });
        }

        // BURN the nonce instantly to prevent replay
        await prisma.memberProfile.update({
          where: { id: targetMemberId },
          data: { lastQrNonce: null, qrNonceExpiresAt: null }
        });

      } catch (err: any) {
        if (err.code === 'ERR_JWT_EXPIRED') {
          return NextResponse.json({ error: "QR token expired. Please refresh the QR code." }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid QR signature" }, { status: 400 });
      }
    } else if (originalMethod) {
      actualMethod = originalMethod; // Preserve QR method if this is an override retry
    }

    if (!targetMemberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    // 2. Fetch Member & Upcoming Bookings
    const memberProfile = await prisma.memberProfile.findUnique({
      where: { id: targetMemberId, user: { tenantId } },
      include: {
        user: { select: { name: true, email: true, image: true } }
      }
    });

    if (!memberProfile) {
      return NextResponse.json({ error: "Member not found in this tenant" }, { status: 404 });
    }

    // 3. Prevent Duplicate Scans within 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
    const recentCheckIn = await prisma.attendance.findFirst({
      where: { memberId: targetMemberId, tenantId, checkInTime: { gte: fiveMinsAgo } }
    });

    if (recentCheckIn && !overrideType && !bookingId) {
      return NextResponse.json({ 
        error: "Already checked in recently", 
        attendanceId: recentCheckIn.id 
      }, { status: 409 });
    }

    // 4. Validate Membership
    const activeSub = await prisma.subscription.findFirst({
      where: {
        memberId: targetMemberId,
        tenantId,
        status: "ACTIVE",
        endDate: { gt: new Date() }
      }
    });

    // Find upcoming bookings for contextual UI
    const twoHoursFromNow = new Date(Date.now() + 2 * 3600000);
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        memberId: targetMemberId,
        tenantId,
        status: "CONFIRMED",
        date: { gte: twoHoursAgo, lte: twoHoursFromNow }
      },
      include: {
        classSession: true,
        trainer: { include: { user: { select: { name: true } } } }
      }
    });

    if (!activeSub && !overrideType) {
      // BLOCK check-in
      // Log the denied event for security audit
      await prisma.attendanceEvent.create({
        data: {
          tenantId,
          memberId: targetMemberId,
          eventType: "DENIED_EXPIRED",
          notes: "Membership expired or inactive",
        }
      });

      return NextResponse.json({ 
        blocked: true, 
        reason: "Membership Expired", 
        memberId: targetMemberId,
        member: memberProfile,
        upcomingBookings
      }, { status: 403 });
    }

    // 5. Calculate Attendance Type (Strict Attribution Resolver)
    let attendanceType = "GENERAL";
    let finalBookingId = bookingId || null;

    // We search the +/- window to find the highest priority booking
    if (!finalBookingId && upcomingBookings.length > 0) {
      // Priority 1: Class Sessions
      const classBooking = upcomingBookings.find(b => b.classSessionId !== null);
      if (classBooking) {
        finalBookingId = classBooking.id;
        attendanceType = "CLASS";
      } else {
        // Priority 2: Trainer Sessions
        const trainerBooking = upcomingBookings.find(b => b.trainerId !== null);
        if (trainerBooking) {
          finalBookingId = trainerBooking.id;
          attendanceType = "TRAINER";
        }
      }
    } else if (finalBookingId) {
      // If manually passed
      const b = upcomingBookings.find(x => x.id === finalBookingId);
      if (b) {
        attendanceType = b.classSessionId ? "CLASS" : "TRAINER";
      }
    }

    // 6. Create Attendance Record
    const attendance = await prisma.attendance.create({
      data: {
        tenantId,
        memberId: targetMemberId,
        method: actualMethod as "QR" | "MANUAL" | "PIN",
        type: attendanceType as "GENERAL" | "CLASS" | "TRAINER" | "GUEST",
        status: "PRESENT",
        bookingId: finalBookingId,
        events: {
          create: {
            tenantId,
            memberId: targetMemberId,
            eventType: overrideType ? "MEMBERSHIP_OVERRIDE" : "CHECK_IN_SUCCESS",
            overrideType: overrideType || null,
            notes: overrideType ? `Admin override applied` : null
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      attendance,
      member: memberProfile,
      upcomingBookings
    });

  } catch (error) {
    console.error("Check-in Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
