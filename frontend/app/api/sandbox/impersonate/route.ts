import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { userId, action } = await req.json();

    const cookieStore = await cookies();

    if (action === "revert") {
      cookieStore.delete("sandbox_impersonate_userId");
      return NextResponse.json({ success: true, message: "Impersonation cleared" });
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { getAuthSession } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");

    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!targetUser || !targetUser.tenant?.isDemo) {
      return NextResponse.json({ error: "Cannot impersonate non-sandbox user" }, { status: 403 });
    }

    // Set cookie that expires in 1 hour
    cookieStore.set({
      name: "sandbox_impersonate_userId",
      value: userId,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
    });

    return NextResponse.json({ success: true, message: "Impersonation started" });
  } catch (error) {
    console.error("[SANDBOX_IMPERSONATE_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
