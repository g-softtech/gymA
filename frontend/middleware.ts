import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Determine the base domain (handle local development vs production)
  const isLocalhost = hostname.includes("localhost");
  const baseDomain = isLocalhost ? "localhost:3000" : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "");
  
  // Extract the subdomain (e.g., "mygym.localhost:3000" -> "mygym")
  const subdomain = hostname.replace(`.${baseDomain}`, "");

  const path = url.pathname;
  const searchParams = url.searchParams.toString();
  const pathWithParams = `${path}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // 1. Skip middleware for API routes and static Next.js files
  if (path.startsWith("/api") || path.startsWith("/_next") || path.includes(".")) {
    return NextResponse.next();
  }

  // 2. Subdomain routing for tenants (Gyms)
  if (subdomain !== hostname && subdomain !== "www" && subdomain !== "") {
    // Rewrite to the tenant-specific dynamic route (e.g., app/[tenant]/dashboard)
    return NextResponse.rewrite(new URL(`/${subdomain}${pathWithParams}`, req.url));
  }

  // 3. Default routing for the main marketing/auth domain
  return NextResponse.next();
}

export const config = {
  // Match all request paths except for Next.js internals and APIs
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};