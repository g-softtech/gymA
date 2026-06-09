import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireSuperAdmin,
} from "@/lib/tenant";

/**
 * GET /api/superadmin/users
 * Returns all users across all tenants with optional ?tenantId= filter.
 * SUPERADMIN only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const tenantId = req.nextUrl.searchParams.get("tenantId");
    const role = req.nextUrl.searchParams.get("role");
    const search = req.nextUrl.searchParams.get("search");

    const users = await prisma.user.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(role ? { role: role as "SUPERADMIN" | "ADMIN" | "TRAINER" | "MEMBER" } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        image: true,
        tenant: { select: { name: true, slug: true } },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
