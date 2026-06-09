import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * POST /api/plans — create a membership plan
 * ✅ Phase 4: tenantId derived from session, not from request body
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ✅ Requires ADMIN or SUPERADMIN
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { name, price, durationDays } = await req.json();

    if (!name || !price || !durationDays) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // ✅ tenantId always comes from the session — never from the client body
    const plan = await prisma.membershipPlan.create({
      data: {
        tenantId: ctx.tenantId,
        name,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/plans — list membership plans for the session tenant
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    if (!ctx?.tenantId) return noTenantContext();

    const plans = await prisma.membershipPlan.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(plans);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}