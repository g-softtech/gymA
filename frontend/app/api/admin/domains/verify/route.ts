import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { verifyDomainStatus } from "@/lib/vercel";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: session.user.tenantId },
      select: { customDomain: true, domainVerified: true },
    });

    if (!settings?.customDomain) {
      return NextResponse.json({ error: "No custom domain configured" }, { status: 404 });
    }

    // Call Vercel API
    const vercelStatus = await verifyDomainStatus(settings.customDomain);

    if (vercelStatus.verified) {
      await prisma.tenantSettings.update({
        where: { tenantId: session.user.tenantId },
        data: { domainVerified: true, dnsVerifiedAt: new Date() },
      });
      return NextResponse.json({ success: true, verified: true });
    } else {
      return NextResponse.json({ success: true, verified: false, vercelStatus });
    }
  } catch (error: any) {
    console.error("[POST /api/admin/domains/verify]", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
