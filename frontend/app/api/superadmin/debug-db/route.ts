import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        settings: true,
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5
        },
        billingEvents: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        plan: tenant.plan,
        billingStatus: tenant.billingStatus,
        billingEndsAt: tenant.billingEndsAt,
      },
      settings: tenant.settings,
      invoices: tenant.invoices,
      billingEvents: tenant.billingEvents,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
