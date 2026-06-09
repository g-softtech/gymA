import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireTrainer,
  noTenantContext,
} from "@/lib/tenant";

// PATCH /api/trainer/schedule — update trainer availability
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    // ✅ Phase 4: proper role guard + tenantId from session
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireTrainer(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { availability } = await req.json();

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.userId },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 });
    }

    const updated = await prisma.trainerProfile.update({
      where: { userId: ctx.userId },
      data: { availability },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
