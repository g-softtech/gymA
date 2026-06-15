import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    
    // Fetch PENDING actions from DB
    const pendingActions = await prisma.actionRegistry.findMany({
      where: {
        tenantId,
        status: "PENDING"
      },
      orderBy: { createdAt: "desc" }
    });

    const retentionTypes = ["WIN_BACK_OFFER", "REENGAGEMENT_MESSAGE", "ONBOARDING_REMINDER", "UPSELL_MEMBERSHIP"];
    const revenueTypes = ["PRICE_INCREASE", "DISCOUNT", "BUNDLE", "MEMBERSHIP_UPGRADE"];

    const retentionActions = pendingActions.filter(a => retentionTypes.includes(a.actionType));
    const revenueOpportunities = pendingActions.filter(a => revenueTypes.includes(a.actionType));

    return NextResponse.json({
      actions: pendingActions,
      summary: {
        totalActions: pendingActions.length,
        retentionActions: retentionActions.length,
        revenueOpportunities: revenueOpportunities.length
      }
    });

  } catch (error) {
    console.error("Intelligence Actions Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
