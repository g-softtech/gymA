export { default } from "next-auth/middleware";

export const config = {
  // Protects all routes under /dashboard
  matcher: ["/dashboard/:path*"],
};
