import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { slug, email } = await req.json();

    if (!slug || !email) {
      return NextResponse.json({ error: "Missing slug or email" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? "Unknown IP";
    const userAgent = req.headers.get("user-agent") ?? "Unknown Device";
    const sessionId = crypto.randomUUID();
    const now = new Date();

    // Create standardized tracking record
    await prisma.actionRegistry.create({
      data: {
        tenantId: tenant.id,
        actionType: "SANDBOX_PORTAL_VISIT",
        targetId: slug,
        context: JSON.stringify({
          email,
          sessionId,
          startedAt: now.toISOString(),
          lastHeartbeatAt: now.toISOString(),
          durationSeconds: 0,
          ip,
          userAgent,
        }),
        status: "COMPLETED",
        executedAt: now
      }
    });

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("cortexfit_sandbox_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("[SANDBOX_SESSION_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
