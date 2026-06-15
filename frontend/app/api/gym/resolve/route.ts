import { NextRequest, NextResponse } from "next/server";
import { getTenantByCustomDomain } from "@/lib/tenant";

/**
 * GET /api/gym/resolve?domain=<hostname>&path=<pathname>
 *
 * Custom domain resolver — called by middleware when a request arrives on a
 * non-platform hostname (e.g. powergymlago.com).
 *
 * Flow:
 *  1. Look up TenantSettings.customDomain matching the incoming hostname.
 *  2. If found and domain is verified, redirect to /gym/[slug][path].
 *  3. If not found, return a 404 page.
 *
 * This runs as a standard Next.js route (not Edge runtime) so it can use Prisma.
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  const path = req.nextUrl.searchParams.get("path") ?? "/";

  if (!domain) {
    return NextResponse.json({ error: "domain param required" }, { status: 400 });
  }

  // Normalise: strip www prefix before passing to the lookup helper
  // (The helper will further trim and lowercase it)
  const baseDomain = domain.replace(/^www\./i, "");

  try {
    const settings = await getTenantByCustomDomain(baseDomain);

    if (!settings || !settings.tenant || !settings.tenant.isActive) {
      // Domain not registered, not verified, or tenant inactive — serve a 404
      const url = req.nextUrl.clone();
      url.pathname = "/not-found";
      return NextResponse.redirect(url);
    }

    const { slug } = settings.tenant;

    // Redirect to the canonical path-based URL so all existing routing works
    const url = req.nextUrl.clone();
    url.hostname = req.nextUrl.hostname; // keep on the platform host
    url.pathname = path === "/" ? `/gym/${slug}` : `/gym/${slug}${path}`;
    url.searchParams.delete("domain");
    url.searchParams.delete("path");

    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[GET /api/gym/resolve]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
