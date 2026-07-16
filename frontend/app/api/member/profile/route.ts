import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
// PATCH /api/member/profile — update profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, weightKg, heightCm, fitnessGoals } = await req.json();

    // Update user name
    if (name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }

    // Upsert member profile
    const profile = await prisma.memberProfile.upsert({
      where: { userId: session.user.id },
      update: {
        weightKg: weightKg ? parseFloat(weightKg) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        fitnessGoals: fitnessGoals ?? [],
      },
      create: {
        userId: session.user.id,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        fitnessGoals: fitnessGoals ?? [],
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
