import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { EntitlementsSchema, defaultEntitlements } from "@/lib/entitlements/schema";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { planId } = await params;
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    if (plan.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.membershipPlan.delete({ where: { id: planId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { planId } = await params;
    
    const existingPlan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!existingPlan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    
    if (existingPlan.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, price, durationDays, description, features, featured, entitlements } =
      await req.json();

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json(
        { error: "name, price, and durationDays are required." },
        { status: 400 }
      );
    }

    // Check name collision
    const duplicateName = await prisma.membershipPlan.findFirst({
      where: {
        tenantId: session.user.tenantId,
        name: String(name).trim(),
        id: { not: planId }
      }
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: "A plan with this name already exists." },
        { status: 400 }
      );
    }

    let validatedEntitlements = defaultEntitlements;
    if (entitlements) {
      const parsed = EntitlementsSchema.safeParse(entitlements);
      if (parsed.success) {
        validatedEntitlements = parsed.data;
      }
    }

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        name: String(name).trim(),
        price: parseFloat(String(price)),
        durationDays: parseInt(String(durationDays)),
        description: description?.trim() ?? null,
        features: Array.isArray(features) ? features.filter(Boolean) : [],
        featured: Boolean(featured),
        entitlements: validatedEntitlements,
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (err) {
    console.error("[PUT /api/plans/[planId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}