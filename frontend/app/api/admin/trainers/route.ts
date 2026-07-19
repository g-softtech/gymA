import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";
import { checkTrainerQuota } from "@/lib/enforcement";
import { auditLogger, AuditEventType } from "@/lib/auditLogger";
import { validateBody, trainerCreateSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ✅ Role check via helper
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    // ✅ Phase 9B.4: SaaS Trainer Limit Enforcement
    const quota = await checkTrainerQuota(ctx.tenantId);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }

    const { data, error } = await validateBody(trainerCreateSchema)(req);
    if (error) return error;
    const { email, specialties, bio, hourlyRate } = data!;

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

    await prisma.user.update({ where: { id: user.id }, data: { role: "TRAINER", sessionVersion: { increment: 1 } } });

    const profile = await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: {
        specialties: specialties ?? [],
        bio: bio ?? "",
        hourlyRate: hourlyRate ?? null,
      },
      create: {
        userId: user.id,
        specialties: specialties ?? [],
        availability: {},
        bio: bio ?? "",
        hourlyRate: hourlyRate ?? null,
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

    auditLogger.log(
      AuditEventType.MEMBER_PROMOTED,
      ctx.tenantId,
      { targetUserId: user.id, newRole: "TRAINER", targetEmail: user.email },
      ctx.userId
    );

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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ✅ Role check via helper
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { userId, showOnWebsite, title, yearsOfExperience, specialties, bio, publicPhotoUrl } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: "User not found or does not belong to your gym." },
        { status: 404 }
      );
    }

    const profile = await prisma.trainerProfile.update({
      where: { userId },
      data: {
        showOnWebsite: showOnWebsite ?? false,
        title: title ?? null,
        yearsOfExperience: yearsOfExperience ?? null,
        specialties: specialties ?? [],
        bio: bio ?? null,
        publicPhotoUrl: publicPhotoUrl ?? null,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("[PATCH /api/admin/trainers]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

