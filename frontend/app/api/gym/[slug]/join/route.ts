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

    const TRACE = `[FORENSIC:join-api][${Date.now()}]`;
    console.log(`${TRACE} ┌─ POST /api/gym/${slug}/join`);
    console.log(`${TRACE} │  session present  = ${!!session?.user?.id}`);
    console.log(`${TRACE} │  user.id          = ${session?.user?.id ?? "undefined"}`);
    console.log(`${TRACE} │  user.email       = ${session?.user?.email ?? "undefined"}`);
    console.log(`${TRACE} │  user.role        = ${(session?.user as any)?.role ?? "undefined"}`);
    console.log(`${TRACE} │  user.tenantId    = ${(session?.user as any)?.tenantId ?? "undefined"}`);
    console.log(`${TRACE} │  user.tenantSlug  = ${(session?.user as any)?.tenantSlug ?? "undefined"}`);

    if (!session?.user?.id) {
      console.log(`${TRACE} └─ DENY: no session → redirect to signin`);
      return NextResponse.redirect(new URL(`/api/auth/signin`, _req.url));
    }

    // Already has a tenant — do not re-assign
    if ((session.user as any).tenantId) {
      console.log(`${TRACE} └─ ALREADY HAS TENANT: tenantId=${(session.user as any).tenantId} → redirect to /gym/${slug}/dashboard/member`);
      return NextResponse.redirect(
        new URL(`/gym/${slug}/dashboard/member`, _req.url)
      );
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      console.log(`${TRACE} └─ ERROR: tenant not found for slug=${slug}`);
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }
    console.log(`${TRACE} │  tenant.id        = ${tenant.id}`);
    console.log(`${TRACE} │  tenant.slug      = ${tenant.slug}`);

    // ✅ Phase 9B.4: Enforce Member Limit
    const quota = await checkMemberQuota(tenant.id);
    if (!quota.allowed) {
      console.log(`${TRACE} └─ QUOTA EXCEEDED: ${quota.reason}`);
      return NextResponse.redirect(
        new URL(`/gym/${slug}/join?error=${encodeURIComponent(quota.reason!)}`, _req.url)
      );
    }

    // Assign the user to this tenant
    await prisma.user.update({
      where: { id: session.user.id },
      data: { tenantId: tenant.id },
    });
    console.log(`${TRACE} │  DB WRITE: user.tenantId set to ${tenant.id} for userId=${session.user.id}`);

    // Force a session refresh by redirecting through sign-in with callback
    const redirectTarget = `/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`;
    console.log(`${TRACE} └─ REDIRECT after join: ${redirectTarget}`);
    return NextResponse.redirect(
      new URL(
        redirectTarget,
        _req.url
      )
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
