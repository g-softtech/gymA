import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    if (!slug) return NextResponse.json({ data: null });

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { settings: true },
    });

    if (!tenant) return NextResponse.json({ data: null });

    return NextResponse.json({
      data: {
        brandName: tenant.settings?.brandName || tenant.name,
        logoUrl: tenant.settings?.logoUrl || null,
        primaryColor: tenant.settings?.primaryColor || "#6366F1",
        secondaryColor: tenant.settings?.secondaryColor || "#8B5CF6",
        whiteLabelEnabled: tenant.settings?.whiteLabelEnabled || false,
      }
    });
  } catch (error) {
    return NextResponse.json({ data: null });
  }
}
