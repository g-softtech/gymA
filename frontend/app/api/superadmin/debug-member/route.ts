import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const member = await prisma.memberProfile.findFirst({
      where: { tenantId: tenant.id },
      include: {
        user: true,
        subscriptions: { orderBy: { createdAt: "desc" } },
        transactions: { orderBy: { createdAt: "desc" } }
      }
    });

    return NextResponse.json({ member });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
