import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

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
        subscriptionPlan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    });

    if (!settings) {
      return NextResponse.json({ error: "Tenant settings not found" }, { status: 404 });
    }

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("[GET /api/billing/status]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
