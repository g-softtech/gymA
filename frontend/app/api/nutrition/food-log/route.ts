import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext, assertUserCanManageMember } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId from session
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { memberId, mealType, foodName, calories, protein, carbs, fats, quantity, unit, date } =
      await req.json();

    if (!memberId || !foodName || !mealType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Phase 9C: Enforce RBAC and Tenant ownership
    const authErr = await assertUserCanManageMember(ctx, memberId);
    if (authErr) return authErr;

    const log = await prisma.foodLog.create({
      data: {
        memberId,
        tenantId: ctx.tenantId, // ✅
        mealType,
        foodName,
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        quantity: parseFloat(quantity) || 1,
        unit: unit || "serving",
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const logId = req.nextUrl.searchParams.get("logId");
    if (!logId) return NextResponse.json({ error: "logId required" }, { status: 400 });

    const memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    const log = await prisma.foodLog.findUnique({ where: { id: logId } });
    if (!log || log.memberId !== memberProfile?.id || log.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleteResult = await prisma.foodLog.deleteMany({ where: { id: logId, tenantId: ctx.tenantId } });
    if (deleteResult.count === 0) return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
