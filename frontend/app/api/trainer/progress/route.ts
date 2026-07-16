import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
import { verifyWriteAccess } from "@/lib/sandbox/guard";
  getTenantContextFromSession,
  requireTrainer,
  noTenantContext,
} from "@/lib/tenant";

// POST /api/trainer/progress — record a progress entry
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireTrainer(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { memberId, weightKg, bodyFatPct, muscleMass, chestCm, waistCm, hipsCm, notes } =
      await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    // ✅ Verify the member belongs to the same tenant
    const memberProfile = await prisma.memberProfile.findUnique({
      where: { id: memberId },
      select: { user: { select: { tenantId: true } } },
    });

    if (!memberProfile || memberProfile.user.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Member not found in your gym" }, { status: 404 });
    }

    const record = await prisma.progressRecord.create({
      data: {
        memberId,
        tenantId: ctx.tenantId, // ✅ from session
        recordedBy: ctx.userId,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        bodyFatPct: bodyFatPct ? parseFloat(bodyFatPct) : null,
        muscleMass: muscleMass ? parseFloat(muscleMass) : null,
        chestCm: chestCm ? parseFloat(chestCm) : null,
        waistCm: waistCm ? parseFloat(waistCm) : null,
        hipsCm: hipsCm ? parseFloat(hipsCm) : null,
        notes,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/trainer/progress?memberId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireTrainer(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const memberId = req.nextUrl.searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    // ✅ Scoped to tenant
    const records = await prisma.progressRecord.findMany({
      where: { memberId, tenantId: ctx.tenantId },
      orderBy: { recordedAt: "asc" },
    });

    return NextResponse.json(records);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
