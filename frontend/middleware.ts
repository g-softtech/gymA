import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Phase 1: Basic auth guard.
 * Phase 7 will extend this with subdomain extraction and custom domain routing.
 */
export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as NextRequest & { nextauth: { token: { role?: string; tenantId?: string } | null } }).nextauth?.token;
    const { pathname } = req.nextUrl;

    // ─── Redirect unauthenticated users who land on the root to sign-in ───────
    // (NextAuth's pages.signIn handles the actual redirect for protected routes)

    // ─── SUPERADMIN protection ─────────────────────────────────────────────────
    // Block non-SUPERADMIN users from accessing /admin routes
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
      /**
       * Return true to allow the request through to the middleware function above.
       * Return false to redirect to the sign-in page automatically.
       */
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // ─── Public routes — always allow ─────────────────────────────────────
        // Next.js API auth endpoints
        if (pathname.startsWith("/api/auth")) return true;
        // Public blog and contact form submission
        if (pathname.startsWith("/api/blog")) return true;
        if (pathname.startsWith("/api/contact")) return true;
        // Public tenant settings (for public gym pages)
        if (pathname.startsWith("/api/tenant/settings")) return true;

        // ─── Protected API routes — require a valid session token ─────────────
        if (pathname.startsWith("/api/")) {
          return !!token;
        }

        // ─── Dashboard routes — require a valid session token ─────────────────
        if (pathname.includes("/dashboard")) {
          return !!token;
        }

        // ─── Onboarding — require auth ────────────────────────────────────────
        if (pathname.startsWith("/onboarding")) {
          return !!token;
        }

        // ─── SUPERADMIN dashboard — require auth (role check in middleware fn) ─
        if (pathname.startsWith("/admin")) {
          return !!token;
        }

        // ─── All other routes (marketing pages, gym public pages) — allow ──────
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
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
