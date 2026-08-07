import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cortexfit.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/pricing",
        "/features",
        "/blog",
        "/gym/*"
      ],
      disallow: [
        "/api/",
        "/dashboard/",
        "/admin/",
        "/auth/",
        "/onboarding/",
        "/billing/",
        "/settings/",
        "/sandbox/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
