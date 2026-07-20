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
