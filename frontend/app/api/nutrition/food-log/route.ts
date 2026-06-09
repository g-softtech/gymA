import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, mealType, foodName, calories, protein, carbs, fats, quantity, unit, date } =
      await req.json();

    if (!memberId || !foodName || !mealType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await prisma.foodLog.create({
      data: {
        memberId,
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

    const logId = req.nextUrl.searchParams.get("logId");
    if (!logId) return NextResponse.json({ error: "logId required" }, { status: 400 });

    const memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    const log = await prisma.foodLog.findUnique({ where: { id: logId } });
    if (!log || log.memberId !== memberProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.foodLog.delete({ where: { id: logId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
