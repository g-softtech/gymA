
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
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
              "style-src 'self' 'unsafe-inline' https://checkout.paystack.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "frame-src 'self' https://checkout.paystack.com",
              "connect-src 'self' https://api.paystack.co https://checkout.paystack.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
