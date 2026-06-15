import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Domain routing helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The root domain the platform runs on (e.g. "cortexfit.com" or "localhost:3000").
 * Set NEXT_PUBLIC_ROOT_DOMAIN in .env. Falls back to "localhost:3000" for local dev.
 */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/**
 * Extracts the gym slug from an incoming request hostname.
 *
 * Supports three routing modes:
 *
 *  1. Subdomain:    powergymlago.cortexfit.com  → slug = "powergymlago"
 *  2. Custom domain: powergymlago.com           → slug resolved via DB (handled in page layer)
 *  3. Path-based:   cortexfit.com/gym/[slug]     → no rewrite needed, Next.js handles it natively
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
        nextauth: { token: { role?: string; tenantId?: string; tenantSlug?: string; email?: string } | null };
      }
    ).nextauth?.token;

    const { pathname } = req.nextUrl;
    const hostname = req.headers.get("host") ?? "";

    // ── FORENSIC: log every middleware invocation with full token state ──
    const TRACE = `[FORENSIC:middleware][${Date.now()}]`;
    console.log(`${TRACE} ┌─ REQUEST: ${hostname}${pathname}`);
    console.log(`${TRACE} │  token present   = ${!!token}`);
    console.log(`${TRACE} │  token.sub       = ${token?.sub ?? "undefined"}`);
    console.log(`${TRACE} │  token.email     = ${(token as any)?.email ?? "undefined"}`);
    console.log(`${TRACE} │  token.role      = ${(token as any)?.role ?? "undefined"}`);
    console.log(`${TRACE} │  token.tenantId  = ${(token as any)?.tenantId ?? "undefined"}`);
    console.log(`${TRACE} │  token.tenantSlug= ${(token as any)?.tenantSlug ?? "undefined"}`);

    // ── 0. API Route Bailout ────────────────────────────────────────────────
    if (pathname.startsWith("/api/")) {
      console.log(`${TRACE} └─ PASS: API route bailout`);
      return NextResponse.next();
    }

    // ── 1. Subdomain routing ────────────────────────────────────────────────
    const subdomainSlug = getSubdomainSlug(hostname);
    if (subdomainSlug) {
      const newPathname = pathname === "/"
        ? `/gym/${subdomainSlug}`
        : `/gym/${subdomainSlug}${pathname}`;
      const url = req.nextUrl.clone();
      url.pathname = newPathname;
      console.log(`${TRACE} └─ REWRITE: subdomain → ${newPathname}`);
      return NextResponse.rewrite(url);
    }

    // ── 2. Custom domain routing ────────────────────────────────────────────
    if (isCustomDomain(hostname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/api/gym/resolve";
      url.searchParams.set("domain", hostname);
      url.searchParams.set("path", pathname);
      console.log(`${TRACE} └─ REWRITE: custom domain → /api/gym/resolve?domain=${hostname}`);
      return NextResponse.rewrite(url);
    }

    console.log(`${TRACE} └─ PASS: proceeding to page handler`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        const hostname = req.headers.get("host") ?? "";

        // ── FORENSIC: log every authorized() call ────────────────────────
        const ATRACE = `[FORENSIC:authorized][${Date.now()}]`;
        console.log(`${ATRACE} ┌─ PATH: ${pathname}`);
        console.log(`${ATRACE} │  token present    = ${!!token}`);
        console.log(`${ATRACE} │  token.role       = ${(token as any)?.role ?? "undefined"}`);
        console.log(`${ATRACE} │  token.tenantId   = ${(token as any)?.tenantId ?? "undefined"}`);
        console.log(`${ATRACE} │  token.tenantSlug = ${(token as any)?.tenantSlug ?? "undefined"}`);
        console.log(`${ATRACE} │  token.email      = ${(token as any)?.email ?? "undefined"}`);

        // ── Public routes ─────────────────────────────────────────────────
        if (pathname.startsWith("/api/auth")) {
          console.log(`${ATRACE} └─ ALLOW: /api/auth (public)`);
          return true;
        }
        if (pathname.startsWith("/api/blog")) return true;
        if (pathname.startsWith("/api/contact")) return true;
        if (pathname.startsWith("/api/tenant/settings")) return true;
        if (pathname.startsWith("/api/gym/")) return true;
        if (pathname.startsWith("/api/payments/webhook")) return true;
        if (pathname.startsWith("/api/cron/")) return true;
        if (pathname.includes("/join")) return true;
        if (pathname.startsWith("/(marketing)")) return true;
        if (pathname.startsWith("/gym/") && !pathname.includes("/dashboard")) return true;
        if (isCustomDomain(hostname)) return true;

        // ── Protected routes ──────────────────────────────────────────────
        if (pathname.startsWith("/api/")) {
          const result = !!token;
          console.log(`${ATRACE} └─ ${result ? "ALLOW" : "DENY (no token)"}: protected API`);
          return result;
        }
        if (pathname.includes("/dashboard")) {
          const result = !!token;
          console.log(`${ATRACE} └─ ${result ? "ALLOW" : "DENY → sign-in redirect"}: /dashboard requires token`);
          return result;
        }
        if (pathname.startsWith("/admin")) {
          const result = !!token;
          console.log(`${ATRACE} └─ ${result ? "ALLOW" : "DENY"}: /admin`);
          return result;
        }
        if (pathname.startsWith("/onboarding")) {
          const result = !!token;
          console.log(`${ATRACE} └─ ${result ? "ALLOW" : "DENY"}: /onboarding`);
          return result;
        }

        console.log(`${ATRACE} └─ ALLOW: default pass-through`);
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
