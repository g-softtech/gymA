import { NextResponse } from "next";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com";
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-marketing.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-gyms.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
