import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email")?.toString();

    // Ensure we are only impersonating demo users
    if (!email || !email.endsWith("@demo.cortexfit.com")) {
      return NextResponse.json({ error: "Invalid demo user" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!targetUser || !targetUser.tenant?.isDemo) {
      return NextResponse.json({ error: "Cannot impersonate non-demo user" }, { status: 403 });
    }

    // Set cookie that expires in 1 hour
    const cookieStore = await cookies();
    cookieStore.set({
      name: "sandbox_impersonate_userId",
      value: targetUser.id,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
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
    console.error("[DEMO_IMPERSONATE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
