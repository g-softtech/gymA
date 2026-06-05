
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { tenantId, name, price, durationDays } = await req.json();
    if (!tenantId || !name || !price || !durationDays) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const plan = await prisma.membershipPlan.create({
      data: { tenantId, name, price: parseFloat(price), durationDays: parseInt(durationDays) },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}