import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cortexfit.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/dashboard/",
        "/superadmin/",
        "/sandbox/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
