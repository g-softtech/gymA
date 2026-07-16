import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const plans = await prisma.membershipPlan.findMany({
      where: { tenantId },
      orderBy: { price: "asc" }
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET /api/admin/memberships/plans error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const body = await req.json();
    const { name, description, price, currency, durationDays, isActive, features, featured } = body;

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        tenantId,
        name,
        description,
        price,
        currency: currency || "NGN",
        durationDays: Number(durationDays),
        isActive: isActive !== undefined ? isActive : true,
        features: features || [],
        featured: featured || false,
      }
    });

    return NextResponse.json({ message: "Plan created successfully", plan });
  } catch (error) {
    console.error("POST /api/admin/memberships/plans error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
