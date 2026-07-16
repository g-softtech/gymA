import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
import { verifyWriteAccess } from "@/lib/sandbox/guard";
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    // ✅ Admin only
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { title, description, type, goal, unit, startDate, endDate } =
      await req.json();

    // ✅ tenantId from session — not from request body
    if (!title || !goal || !unit || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const challenge = await prisma.challenge.create({
      data: {
        tenantId: ctx.tenantId, // ✅ from session
        title,
        description: description ?? "",
        type: type ?? "CUSTOM",
        goal: parseInt(goal),
        unit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: ctx.userId,
      },
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    if (!ctx?.tenantId) return noTenantContext();

    const challenges = await prisma.challenge.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(challenges);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
