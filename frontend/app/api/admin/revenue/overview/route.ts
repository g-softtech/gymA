import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get start of week (Sunday)
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        status: { in: ["SUCCESS", "REFUNDED"] }
      }
    });

    const aggregate = (currency: "NGN" | "USD") => {
      const currTxs = transactions.filter(t => t.currency === currency);
      
      const successTxs = currTxs.filter(t => t.status === "SUCCESS" || t.status === "REFUNDED");
      const refunds = currTxs.filter(t => t.refundedAmount && Number(t.refundedAmount) > 0);
      
      const sum = (txs: typeof currTxs) => txs.reduce((acc, t) => acc + Number(t.amount), 0);
      const sumRefunds = () => refunds.reduce((acc, t) => acc + Number(t.refundedAmount), 0);
      
      const totalRevenue = sum(successTxs);
      const totalRefunds = sumRefunds();

      return {
        today: sum(successTxs.filter(t => t.createdAt >= todayStart)),
        week: sum(successTxs.filter(t => t.createdAt >= weekStart)),
        month: sum(successTxs.filter(t => t.createdAt >= monthStart)),
        year: sum(successTxs.filter(t => t.createdAt >= yearStart)),
        bySource: {
          MEMBERSHIP: sum(successTxs.filter(t => t.itemType === "MEMBERSHIP")),
          TRAINER_SESSION: sum(successTxs.filter(t => t.itemType === "TRAINER_SESSION")),
          CLASS_BOOKING: sum(successTxs.filter(t => t.itemType === "CLASS_BOOKING")),
          JOINING_FEE: sum(successTxs.filter(t => t.itemType === "JOINING_FEE")),
        },
        refunds: totalRefunds,
        netRevenue: totalRevenue - totalRefunds
      };
    };

    return NextResponse.json({
      revenue: {
        NGN: aggregate("NGN"),
        USD: aggregate("USD")
      }
    });
  } catch (error) {
    console.error("GET /api/admin/revenue/overview error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
