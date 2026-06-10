import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Domain routing helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The root domain the platform runs on (e.g. "smartgym.com" or "localhost:3000").
 * Set NEXT_PUBLIC_ROOT_DOMAIN in .env. Falls back to "localhost:3000" for local dev.
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/**
 * Extracts the gym slug from an incoming request hostname.
 *
 * Supports three routing modes:
 *
 *  1. Subdomain:    powergymlago.smartgym.com  → slug = "powergymlago"
 *  2. Custom domain: powergymlago.com           → slug resolved via DB (handled in page layer)
 *  3. Path-based:   smartgym.com/gym/[slug]     → no rewrite needed, Next.js handles it natively
 *
 * Returns null if the hostname is the root domain itself or a well-known system subdomain.
 */
function getSubdomainSlug(hostname: string): string | null {
  // Normalise: strip port for comparison
  const host = hostname.split(":")[0];
  const rootHost = ROOT_DOMAIN.split(":")[0];

  // Ignore www and other reserved subdomains
  const RESERVED = new Set(["www", "app", "api", "admin", "mail", "smtp"]);

  // Check if this is a subdomain of our root domain
  if (host.endsWith(`.${rootHost}`)) {
    const sub = host.slice(0, host.length - rootHost.length - 1);
    if (sub && !RESERVED.has(sub)) {
      return sub; // e.g. "powergymlago"
    }
  }

  return null;
}

/**
 * Checks whether the hostname is a custom domain (not the root domain or a subdomain of it).
 * Custom domain pages are handled at the page layer via DB lookup — middleware just
 * rewrites to /gym/[slug] after the DB resolves which slug maps to this domain.
 */
function isCustomDomain(hostname: string): boolean {
  const host = hostname.split(":")[0];
  const rootHost = ROOT_DOMAIN.split(":")[0];
  return host !== rootHost && !host.endsWith(`.${rootHost}`) && host !== "localhost";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main middleware (wrapped in withAuth for NextAuth JWT session access)
// ─────────────────────────────────────────────────────────────────────────────

export default withAuth(
  function middleware(req: NextRequest) {
    const token = (
      req as NextRequest & {
        nextauth: { token: { role?: string; tenantId?: string } | null };
      }
    ).nextauth?.token;

    const { pathname } = req.nextUrl;
    const hostname = req.headers.get("host") ?? "";

    // ── 1. Subdomain routing ────────────────────────────────────────────────
    // If request arrives at <slug>.smartgym.com, rewrite to /gym/<slug>/...
    // The actual page at /gym/[slug] handles all the data fetching and rendering.
    const subdomainSlug = getSubdomainSlug(hostname);
    if (subdomainSlug) {
      // Build the new pathname: replace root with /gym/<slug>
      // e.g. powergymlago.smartgym.com/dashboard/admin → /gym/powergymlago/dashboard/admin
      // e.g. powergymlago.smartgym.com/ → /gym/powergymlago
      const newPathname = pathname === "/"
        ? `/gym/${subdomainSlug}`
        : `/gym/${subdomainSlug}${pathname}`;

      const url = req.nextUrl.clone();
      url.pathname = newPathname;
      return NextResponse.rewrite(url);
    }

    // ── 2. Custom domain routing ────────────────────────────────────────────
    // If request arrives at powergymlago.com, we need to look up the tenant slug
    // from the DB and rewrite. Since middleware cannot do async DB calls on the
    // Edge runtime, we rewrite to a special resolver route that does the lookup
    // and then redirects to the correct /gym/[slug] path.
    //
    // The resolver route at /api/gym/resolve?domain=<hostname> will:
    //   1. Query TenantSettings.customDomain = hostname
    //   2. Redirect to /gym/[slug][pathname]
    //
    // We skip this for API routes and Next.js internals on custom domains.
    if (isCustomDomain(hostname) && !pathname.startsWith("/api/auth")) {
      const url = req.nextUrl.clone();
      // Pass along to the domain resolver — it will handle the DB lookup
      url.pathname = "/api/gym/resolve";
      url.searchParams.set("domain", hostname);
      url.searchParams.set("path", pathname);
      return NextResponse.rewrite(url);
    }

    // ── 3. SuperAdmin route guard ───────────────────────────────────────────
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "SUPERADMIN") {
        const url = req.nextUrl.clone();
        url.pathname = "/api/auth/signin";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        const hostname = req.headers.get("host") ?? "";

        // ── Public routes (always allow, no token needed) ──────────────────

        // NextAuth internal routes
        if (pathname.startsWith("/api/auth")) return true;

        // Public API endpoints (blog, contact, public gym data)
        if (pathname.startsWith("/api/blog")) return true;
        if (pathname.startsWith("/api/contact")) return true;
        if (pathname.startsWith("/api/tenant/settings")) return true;
        if (pathname.startsWith("/api/gym/")) return true; // public gym data + resolve + join
        if (pathname.startsWith("/api/payments/webhook")) return true; // Paystack webhook (server-to-server)
        if (pathname.startsWith("/api/cron/")) return true; // Vercel Cron (protected by CRON_SECRET header)

        // Onboarding and join flows can be accessed to redirect to auth
        if (pathname.startsWith("/onboarding")) return true;
        if (pathname.includes("/join")) return true;

        // Platform-level marketing pages
        if (pathname.startsWith("/(marketing)")) return true;

        // Public gym pages (no auth required to view the public website)
        // These are at /gym/[slug] but NOT /gym/[slug]/dashboard
        if (pathname.startsWith("/gym/") && !pathname.includes("/dashboard")) return true;

        // Custom domain requests: let the resolver handle auth
        if (isCustomDomain(hostname)) return true;

        // ── Protected routes (require a valid session token) ──────────────

        // All other /api routes
        if (pathname.startsWith("/api/")) return !!token;

        // All dashboard routes (tenant-level)
        if (pathname.includes("/dashboard")) return !!token;

        // SuperAdmin panel
        if (pathname.startsWith("/admin")) return !!token;

        // Everything else (marketing pages) — allow through
        return true;
      },
    },
    pages: {
      signIn: "/api/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
