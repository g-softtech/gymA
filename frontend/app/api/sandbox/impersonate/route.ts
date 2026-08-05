import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const tenantId = formData.get("tenantId")?.toString();
    const role = formData.get("role")?.toString();
    const email = formData.get("email")?.toString();

    let targetUser;

    if (email) {
      // Impersonate by email (used by Open Sandbox button)
      targetUser = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true },
      });
    } else if (tenantId && role) {
      // Impersonate by role (used by Persona Switcher)
      targetUser = await prisma.user.findFirst({
        where: { tenantId, role: role as any },
        include: { tenant: true },
      });
    }

    if (!targetUser || !targetUser.tenant?.isDemo) {
      return NextResponse.json({ error: "Cannot impersonate non-sandbox user" }, { status: 403 });
    }

    // Verify the actor has permission. 
    // They must either be SUPERADMIN, or they must already be impersonating a user in the same sandbox.
    const session = await getAuthSession();
    const isSuperAdmin = session?.user?.role === "SUPERADMIN";
    
    const cookieStore = await cookies();
    const existingImpersonationId = cookieStore.get("sandbox_impersonate_userId")?.value;
    
    let isAlreadyInSandbox = false;
    if (existingImpersonationId) {
      const existingUser = await prisma.user.findUnique({ where: { id: existingImpersonationId } });
      if (existingUser?.tenantId === targetUser.tenantId) {
        isAlreadyInSandbox = true;
      }
    }

    if (!isSuperAdmin && !isAlreadyInSandbox) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set cookie that expires in 4 hours
    cookieStore.set({
      name: "sandbox_impersonate_userId",
      value: targetUser.id,
      httpOnly: true,
      path: "/",
      maxAge: 4 * 60 * 60,
    });

    // Determine redirect based on role
    let redirectPath = "/";
    if (targetUser.role === "ADMIN") {
      redirectPath = `/gym/${targetUser.tenant.slug}/dashboard/admin`;
    } else if (targetUser.role === "TRAINER") {
      redirectPath = `/gym/${targetUser.tenant.slug}/dashboard/trainer`;
    } else if (targetUser.role === "MEMBER") {
      redirectPath = `/gym/${targetUser.tenant.slug}/dashboard/member`;
    }

    return NextResponse.redirect(new URL(redirectPath, req.url), 302);
  } catch (error) {
    console.error("[SANDBOX_IMPERSONATE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
