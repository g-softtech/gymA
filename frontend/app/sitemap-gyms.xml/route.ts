import { NextResponse } from "next";
import { prisma } from "@/lib/prisma";
import { tenantUrl } from "@/lib/tenant/url";

export async function GET() {
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${tenants.map((tenant) => `
  <url>
    <loc>${tenantUrl(tenant.slug)}</loc>
    <lastmod>${(tenant.settings?.updatedAt || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `).join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
