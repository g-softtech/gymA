import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, tenantSlug, checkOnly, isJoinFlow } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // ── Tenant membership pre-flight ──────────────────────────────────────────
    // This is the PRIMARY enforcement point for cross-tenant auth attempts.
    // It runs before any NextAuth token is generated or any email is sent.
    //
    // Rules:
    //  • tenantSlug present  → user MUST belong to exactly that tenant
    //  • tenantSlug absent   → user MUST NOT be a gym member (platform/SUPERADMIN only)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        tenantId: true,
        role: true,
        tenant: { select: { slug: true, name: true } },
      },
    });

    if (isJoinFlow) {
      // It's a join flow.
      // If they already belong to a DIFFERENT gym, they can't join this one with the same account.
      if (user?.tenantId && tenantSlug && user.tenant?.slug !== tenantSlug) {
         return NextResponse.json(
           {
             error: `This email is already registered with ${user.tenant?.name}. Please use a different email to join this gym.`,
           },
           { status: 403 }
         );
      }
    } else {
      if (tenantSlug) {
        // Tenant-scoped sign-in: the requesting email must belong to this tenant.
        // Unified message prevents account enumeration while still being actionable.
        if (!user || user.tenant?.slug !== tenantSlug) {
          return NextResponse.json(
            {
              error:
                "You are not registered with this gym. Please check the sign-in link or contact your gym administrator.",
            },
            { status: 403 }
          );
        }
      } else {
        // Main-site sign-in: only platform-level (tenantless) accounts allowed.
        // SUPERADMINs have no tenantId so they pass automatically.
        if (user?.tenantId) {
          const gymName = user.tenant?.name ?? "your gym";
          const gymSlug = user.tenant?.slug;
          const portalHint = gymSlug
            ? ` Please sign in at your gym's portal: /gym/${gymSlug}`
            : "";
          return NextResponse.json(
            {
              error: `This account is registered under ${gymName}.${portalHint}`,
            },
            { status: 403 }
          );
        }
      }
    }

    // ── Rate limit check ──────────────────────────────────────────────────────
    // Skip recording when called with checkOnly=true (credentials pre-flight).
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const attempts = await prisma.authRateLimit.count({
      where: {
        email: email.toLowerCase(),
        createdAt: { gte: fifteenMinsAgo },
      },
    });

    if (attempts >= 5) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    if (!checkOnly) {
      await prisma.authRateLimit.create({
        data: {
          email: email.toLowerCase(),
          ip: req.headers.get("x-forwarded-for") || "unknown",
        },
      });

      // Fire-and-forget cleanup to prevent table bloat
      prisma.authRateLimit
        .deleteMany({
          where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rate limit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
