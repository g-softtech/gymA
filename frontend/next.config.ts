import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  // ── Multi-domain support ─────────────────────────────────────────────────
  // Allows the Next.js dev server to accept requests from subdomains and
  // custom domains when tested locally (e.g. powergymlago.localhost:3000).
  // In production (Vercel) this is configured via the dashboard.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.paystack.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.paystack.com",
              "img-src 'self' data: https: blob: res.cloudinary.com",
              "font-src 'self' data: https: https://fonts.gstatic.com",
              "frame-src 'self' https://checkout.paystack.com https://maps.google.com https://www.google.com",
              "connect-src 'self' https://api.paystack.co https://checkout.paystack.com",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },

  // ── Image domains ────────────────────────────────────────────────────────
  // Allow images from any HTTPS source (gym logos, member avatars, gallery photos).
  // Lock this down to specific domains in production if preferred.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
