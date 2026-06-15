import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ planId: string }> }) {
  try {
    const session = await getAuthSession();
    const { planId } = await params;
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const body = await req.json();

    // Verify ownership
    const existing = await prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const plan = await prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        price: body.price !== undefined ? body.price : existing.price,
        currency: body.currency !== undefined ? body.currency : existing.currency,
        durationDays: body.durationDays !== undefined ? Number(body.durationDays) : existing.durationDays,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        features: body.features !== undefined ? body.features : existing.features,
        featured: body.featured !== undefined ? body.featured : existing.featured,
      }
    });

    return NextResponse.json({ message: "Plan updated", plan });
  } catch (error) {
    console.error("PATCH /api/admin/memberships/plans/[planId] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ planId: string }> }) {
  try {
    const session = await getAuthSession();
    const { planId } = await params;
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    // Verify ownership
    const existing = await prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Rather than hard delete, soft delete (disable) to preserve historical data
    await prisma.membershipPlan.update({
      where: { id: planId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Plan disabled successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/memberships/plans/[planId] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
