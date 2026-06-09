import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ✅ Role check via helper
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { email, specialties, bio, hourlyRate } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "No user found with that email. They must sign in first." },
        { status: 404 }
      );
    }

    // ✅ Ensure target user belongs to the admin's tenant (ctx.tenantId from session)
    if (user.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: "User does not belong to your gym." },
        { status: 403 }
      );
    }

    await prisma.user.update({ where: { id: user.id }, data: { role: "TRAINER" } });

    const profile = await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: {
        specialties: specialties ?? [],
        bio: bio ?? "",
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
      create: {
        userId: user.id,
        specialties: specialties ?? [],
        availability: {},
        bio: bio ?? "",
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
    });

    await prisma.notification.create({
      data: {
        tenantId: ctx.tenantId,
        userId: user.id,
        type: "GENERAL",
        title: "You are now a Trainer!",
        message:
          "Your account has been upgraded to Trainer. You can now manage clients and bookings.",
      },
    });

    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ✅ Role check via helper
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    // ✅ tenantId from session — query param is ignored
    const trainers = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId, role: "TRAINER" },
      include: { trainerProfile: { include: { bookings: true } } },
    });

    return NextResponse.json(trainers);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
