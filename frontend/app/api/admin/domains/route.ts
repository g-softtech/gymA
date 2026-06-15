import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { normalizeDomain } from "@/lib/tenant";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel";
import { canUseCustomDomain } from "@/lib/feature-gates";

// Validate domain format (e.g. powergym.com or app.powergym.com)
const isValidDomain = (domain: string) => {
  if (domain.length > 253) return false;
  const regex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return regex.test(domain);
};

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      include: { settings: true },
    });

    if (!tenant || !canUseCustomDomain(tenant.settings?.subscriptionPlan)) {
      return NextResponse.json({ error: "Feature requires PRO or ENTERPRISE plan" }, { status: 403 });
    }

    const { domain } = await req.json();
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const normalized = normalizeDomain(domain);
    if (!isValidDomain(normalized)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    // Ensure not already taken globally by another tenant
    const existing = await prisma.tenantSettings.findFirst({
      where: { customDomain: normalized },
    });

    if (existing) {
      if (existing.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: "Domain already registered" }, { status: 409 });
      }
      // Tenant already owns this exact domain. Idempotent return.
      return NextResponse.json({ 
        success: true, 
        data: existing, 
        message: "Domain is already configured for this tenant" 
      });
    }

    // Register with Vercel
    const vercelResponse = await addDomainToVercel(normalized);
    const verificationToken = vercelResponse?.verificationResponse?.find(
      (v: any) => v.type === "TXT"
    )?.value || null;

    // Save to DB
    const updated = await prisma.tenantSettings.update({
      where: { tenantId: session.user.tenantId },
      data: {
        customDomain: normalized,
        domainVerified: false,
        verificationToken,
        dnsVerifiedAt: null,
      },
    });

    return NextResponse.json({ success: true, data: updated, vercel: vercelResponse });
  } catch (error: any) {
    console.error("[POST /api/admin/domains]", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: session.user.tenantId },
      include: { tenant: true },
    });

    if (settings && !canUseCustomDomain(settings.subscriptionPlan)) {
      return NextResponse.json({ error: "Feature requires PRO or ENTERPRISE plan" }, { status: 403 });
    }

    if (!settings?.customDomain) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("[GET /api/admin/domains]", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain } = await req.json().catch(() => ({ domain: null }));
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const normalized = normalizeDomain(domain);

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: session.user.tenantId },
      include: { tenant: true },
    });

    if (settings && !canUseCustomDomain(settings.subscriptionPlan)) {
      return NextResponse.json({ error: "Feature requires PRO or ENTERPRISE plan" }, { status: 403 });
    }

    if (settings?.customDomain !== normalized) {
      return NextResponse.json({ error: "Domain ownership mismatch" }, { status: 403 });
    }

    try {
      await removeDomainFromVercel(normalized);
    } catch (err: any) {
      console.error("Failed to remove from Vercel:", err.message);
      // Explicitly fail and abort DB mutation if Vercel fails
      return NextResponse.json({ error: "Failed to remove domain from Vercel. Aborting." }, { status: 502 });
    }

    // Clear from DB
    await prisma.tenantSettings.update({
      where: { tenantId: session.user.tenantId },
      data: {
        customDomain: null,
        domainVerified: false,
        verificationToken: null,
        dnsVerifiedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/admin/domains]", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
