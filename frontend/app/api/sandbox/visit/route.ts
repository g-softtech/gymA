import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true }
    });

    if (!tenant) {
      // Just redirect to main site if tenant not found so we don't look broken
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Extract basic tracking info
    const ip = req.headers.get("x-forwarded-for") ?? "Unknown IP";
    const userAgent = req.headers.get("user-agent") ?? "Unknown Device";

    // Create an audit trail using ActionRegistry to track the click
    await prisma.actionRegistry.create({
      data: {
        tenantId: tenant.id,
        actionType: "SANDBOX_PORTAL_VISIT",
        targetId: slug,
        context: JSON.stringify({
          source: url.searchParams.get("source") || "direct",
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        }),
        status: "COMPLETED",
        executedAt: new Date()
      }
    });

    // Finally, redirect them to their magical sandbox environment!
    return NextResponse.redirect(new URL(`/sandbox/${slug}`, req.url));

  } catch (error) {
    console.error("[SANDBOX_VISIT_ERROR]", error);
    // On error, degrade gracefully by still redirecting them to the sandbox
    return NextResponse.redirect(new URL(`/sandbox/${slug}`, req.url));
  }
}
