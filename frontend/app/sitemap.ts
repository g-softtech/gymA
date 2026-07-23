import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cortexfit.vercel.app";

  // Fetch all active, non-demo tenants
  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      isDemo: false,
      status: "APPROVED",
    },
    select: {
      slug: true,
      settings: {
        select: {
          updatedAt: true,
        },
      },
    },
  });

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // We omit /directory from the sitemap for now since we are enforcing strict opt-in visibility
  ];

  for (const tenant of tenants) {
    sitemapEntries.push({
      url: `${baseUrl}/gym/${tenant.slug}`,
      lastModified: tenant.settings?.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return sitemapEntries;
}
