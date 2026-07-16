import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TenantPlan } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { verifyWriteAccess } from "@/lib/sandbox/guard";
import {
  getTenantContextFromSession,
  requireSuperAdmin,
} from "@/lib/tenant";

/**
 * GET /api/superadmin/tenants
 * Returns all tenants with aggregate stats.
 * SUPERADMIN only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const tenants = await prisma.tenant.findMany({
      include: {
        settings: {
          select: {
            logoUrl: true,
            primaryColor: true,
            city: true,
            country: true,
            customDomain: true,
            subdomain: true,
          },
        },
        _count: {
          select: {
            users: true,
            membershipPlans: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tenants);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/superadmin/tenants
 * Update a tenant's plan or active status.
 * SUPERADMIN only.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const { tenantId, plan, isActive } = await req.json();
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const updateData: { plan?: TenantPlan; isActive?: boolean } = {};
    if (plan !== undefined) updateData.plan = plan;
    if (isActive !== undefined) updateData.isActive = isActive;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return NextResponse.json(tenant);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
