import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, title, goal, totalCalories, protein, carbs, fats, meals, isAiGenerated } =
      await req.json();

    if (!memberId || !title || !meals) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await prisma.mealPlan.create({
      data: {
        memberId,
        title,
        goal: goal ?? "GENERAL_HEALTH",
        totalCalories: totalCalories ?? 0,
        protein: protein ?? 0,
        carbs: carbs ?? 0,
        fats: fats ?? 0,
        meals,
        isAiGenerated: isAiGenerated ?? false,
      },
    });

    return NextResponse.json(plan, { status: 201 });
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

    const planId = req.nextUrl.searchParams.get("planId");
    if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

    const memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    const plan = await prisma.mealPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.memberId !== memberProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.mealPlan.delete({ where: { id: planId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
