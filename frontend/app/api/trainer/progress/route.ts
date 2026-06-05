import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// POST /api/trainer/progress — record a progress entry
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, weightKg, bodyFatPct, muscleMass, chestCm, waistCm, hipsCm, notes } =
      await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const record = await prisma.progressRecord.create({
      data: {
        memberId,
        recordedBy: session.user.id,
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = req.nextUrl.searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const records = await prisma.progressRecord.findMany({
      where: { memberId },
      orderBy: { recordedAt: "asc" },
    });

    return NextResponse.json(records);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
