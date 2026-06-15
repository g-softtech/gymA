import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { canUseWhiteLabel } from "@/lib/feature-gates";

// Validation helpers
const isValidHexColor = (color: string) => /^#([0-9a-fA-F]{6})$/i.test(color);
const isValidHttpsUrl = (url: string) => /^https:\/\/[^\s$.?#].[^\s]*$/i.test(url);
const sanitizeBrandName = (name: string) => name.replace(/[<>]/g, "").trim();

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const tenantId = session.user.tenantId as string;

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: {
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        brandName: true,
        whiteLabelEnabled: true,
      },
    });

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("[GET /api/admin/branding]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const tenantId = session.user.tenantId as string;

    const body = await req.json();
    const { logoUrl, primaryColor, secondaryColor, accentColor, brandName, whiteLabelEnabled } = body;

    // Strict Validations
    if (logoUrl && !isValidHttpsUrl(logoUrl)) {
      return NextResponse.json({ error: "Logo URL must be a valid HTTPS image URL" }, { status: 400 });
    }
    if (primaryColor && !isValidHexColor(primaryColor)) {
      return NextResponse.json({ error: "Primary color must be a valid 6-character hex code (e.g. #0ea5e9)" }, { status: 400 });
    }
    if (secondaryColor && !isValidHexColor(secondaryColor)) {
      return NextResponse.json({ error: "Secondary color must be a valid 6-character hex code" }, { status: 400 });
    }
    if (accentColor && !isValidHexColor(accentColor)) {
      return NextResponse.json({ error: "Accent color must be a valid 6-character hex code" }, { status: 400 });
    }

    // Feature gating for White Label
    let finalWhiteLabelEnabled = Boolean(whiteLabelEnabled);
    if (finalWhiteLabelEnabled) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { settings: true }
      });
      if (!tenant || !canUseWhiteLabel(tenant.settings?.subscriptionPlan)) {
        // Force false if not authorized, or return 403. Let's force false to be safe but allow other branding updates.
        finalWhiteLabelEnabled = false;
      }
    }

    const sanitizedBrandName = brandName ? sanitizeBrandName(brandName) : null;

    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        accentColor: accentColor || null,
        brandName: sanitizedBrandName,
        whiteLabelEnabled: finalWhiteLabelEnabled,
      },
      create: {
        tenantId,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        accentColor: accentColor || null,
        brandName: sanitizedBrandName,
        whiteLabelEnabled: finalWhiteLabelEnabled,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[PUT /api/admin/branding]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
