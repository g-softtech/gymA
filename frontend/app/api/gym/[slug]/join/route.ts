import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { checkMemberQuota } from "@/lib/enforcement";

/**
 * POST /api/gym/[slug]/join
 * Assigns the authenticated user to the specified tenant.
 * This is the explicit confirmation endpoint for the /gym/[slug]/join page.
 * Only allows assignment if the user has no tenantId yet.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL(`/api/auth/signin`, _req.url));
    }

    // Already has a tenant — do not re-assign
    if (session.user.tenantId) {
      return NextResponse.redirect(
        new URL(`/gym/${slug}/dashboard/member`, _req.url)
      );
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // ✅ Phase 9B.4: Enforce Member Limit
    const quota = await checkMemberQuota(tenant.id);
    if (!quota.allowed) {
      return NextResponse.redirect(
        new URL(`/gym/${slug}/join?error=${encodeURIComponent(quota.reason!)}`, _req.url)
      );
    }

    // Assign the user to this tenant
    await prisma.user.update({
      where: { id: session.user.id },
      data: { tenantId: tenant.id },
    });

    // Force a session refresh by redirecting through sign-in with callback
    return NextResponse.redirect(
      new URL(
        `/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`,
        _req.url
      )
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
