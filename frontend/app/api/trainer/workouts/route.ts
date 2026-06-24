import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireTrainer,
  noTenantContext,
} from "@/lib/tenant";

// POST /api/trainer/workouts — create workout plan for a member
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireTrainer(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { memberId, title, routines } = await req.json();

    if (!memberId || !title || !routines) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.userId },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 });
    }

    // ✅ Verify member belongs to the same tenant
    const memberProfile = await prisma.memberProfile.findUnique({
      where: { id: memberId },
      select: { user: { select: { tenantId: true } } },
    });

    if (!memberProfile || memberProfile.user.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Member not found in your gym" }, { status: 404 });
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        memberId,
        trainerId: trainerProfile.id,
        tenantId: ctx.tenantId, // ✅ from session
        title,
        routines,
        isAiGenerated: false,
      },
      include: {
        member: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/trainer/workouts?planId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireTrainer(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const planId = req.nextUrl.searchParams.get("planId");
    if (!planId) {
      return NextResponse.json({ error: "planId required" }, { status: 400 });
    }

    const plan = await prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // ✅ Verify plan belongs to this tenant
    if (plan.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.userId },
    });

    if (plan.trainerId !== trainerProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleteResult = await prisma.workoutPlan.deleteMany({ where: { id: planId, tenantId: ctx.tenantId } });
    if (deleteResult.count === 0) return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
