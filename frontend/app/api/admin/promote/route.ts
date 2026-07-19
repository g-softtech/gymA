import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireSuperAdmin,
} from "@/lib/tenant";

/**
 * POST /api/admin/promote
 * Promotes a user to ADMIN role.
 * Restricted to SUPERADMIN only — no longer relies on a plain secret string.
 * Also assigns the target user to a tenantId if provided (required for gym admins).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    // ✅ Only SUPERADMIN can promote users to ADMIN — removed insecure secret-string auth
    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const { email, tenantId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Assign tenantId to the promoted admin if provided
    const updateData: { role: "ADMIN"; sessionVersion: { increment: number }; tenantId?: string } = { role: "ADMIN", sessionVersion: { increment: 1 } };
    if (tenantId) {
      // Verify the tenant exists before assigning
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }
      updateData.tenantId = tenantId;
    }

    const user = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    return NextResponse.json({ success: true, role: user.role, tenantId: user.tenantId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}