import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * GET /api/admin/users
 * Returns users scoped to the authenticated admin's tenant.
 * SUPERADMIN can optionally pass ?tenantId= to query any tenant.
 * Removed the insecure secret-string mechanism entirely.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ✅ Requires at least ADMIN role
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx) return noTenantContext();

    let tenantFilter: string | undefined = ctx.tenantId;

    // SUPERADMIN can query a specific tenant via query param
    if (ctx.role === "SUPERADMIN") {
      const queryTenantId = req.nextUrl.searchParams.get("tenantId");
      if (queryTenantId) tenantFilter = queryTenantId;
      // If no tenantId param, SUPERADMIN gets all users (platform admin view)
      if (!queryTenantId) tenantFilter = undefined;
    }

    const users = await prisma.user.findMany({
      where: tenantFilter ? { tenantId: tenantFilter } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
