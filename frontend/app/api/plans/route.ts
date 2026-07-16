import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";
import { EntitlementsSchema, defaultEntitlements } from "@/lib/entitlements/schema";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
/**
 * POST /api/plans — create a membership plan
 * Now accepts: name, price, durationDays, description, features[], featured, entitlements
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { name, price, durationDays, description, features, featured, entitlements } =
      await req.json();

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json(
        { error: "name, price, and durationDays are required." },
        { status: 400 }
      );
    }

    // Validate entitlements JSON, fallback to defaults if parsing fails
    let validatedEntitlements = defaultEntitlements;
    if (entitlements) {
      const parsed = EntitlementsSchema.safeParse(entitlements);
      if (parsed.success) {
        validatedEntitlements = parsed.data;
      }
    }

    const existingPlan = await prisma.membershipPlan.findFirst({
      where: {
        tenantId: ctx.tenantId,
        name: String(name).trim()
      }
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "A plan with this name already exists." },
        { status: 400 }
      );
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        tenantId: ctx.tenantId,
        name: String(name).trim(),
        price: parseFloat(String(price)),
        durationDays: parseInt(String(durationDays)),
        description: description?.trim() ?? null,
        features: Array.isArray(features) ? features.filter(Boolean) : [],
        featured: Boolean(featured),
        entitlements: validatedEntitlements,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error("[POST /api/plans]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/plans — list all membership plans for the session tenant
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const plans = await prisma.membershipPlan.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(plans);
  } catch (err) {
    console.error("[GET /api/plans]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}