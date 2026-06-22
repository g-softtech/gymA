import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { checkEntitlement } from "@/lib/entitlements/check-entitlement";
import { EntitlementKeys } from "@/lib/entitlements/registry";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantContext = await getTenantContextFromSession(session);
    if (!tenantContext) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const { trainerId, date } = await req.json();

    if (!trainerId || !date) {
      return NextResponse.json({ error: "Missing trainerId or date" }, { status: 400 });
    }

    const member = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
    }

    // 1. Enforce Entitlement Limits (MAX_TRAINER_SESSIONS)
    const entitlement = await checkEntitlement(session.user.id, EntitlementKeys.MAX_TRAINER_SESSIONS, {
      bookingType: "trainer",
      requestedDate: date,
    });

    if (!entitlement.allowed) {
      return NextResponse.json({ error: entitlement.reason }, { status: 403 });
    }

    // 2. Validate Trainer exists
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    // 3. Create Booking
    const booking = await prisma.booking.create({
      data: {
        tenantId: tenantContext.tenantId,
        memberId: member.id,
        trainerId: trainerProfile.id,
        date: new Date(date),
        durationMins: 60,
        sessionType: "PHYSICAL",
        status: "PENDING", // Trainer must approve
      },
    });

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error("[Book Trainer API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
