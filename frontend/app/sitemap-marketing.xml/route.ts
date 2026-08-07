import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com";
  
  const routes = [
    { url: baseUrl, changefreq: "daily", priority: 1.0 },
    { url: `${baseUrl}/pricing`, changefreq: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, changefreq: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changefreq: "monthly", priority: 0.6 },
    { url: `${baseUrl}/directory`, changefreq: "daily", priority: 0.8 },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map((route) => `
  <url>
    <loc>${route.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
  `).join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
