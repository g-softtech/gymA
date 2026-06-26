import { NextRequest, NextResponse } from "next/server";
import { processExpiringSubscriptions } from "@/lib/subscriptions/lifecycleEngine";

export async function GET(req: NextRequest) {
  // 1. Authenticate cron job
  // (In Vercel, you can use the CRON_SECRET headers, or pass a secure token in the URL)
  const authHeader = req.headers.get("authorization");
  
  // NOTE: If using Vercel Cron, you should check req.headers.get('x-vercel-cron')
  // We'll allow a standard Bearer token or Vercel cron header.
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    req.headers.get("x-vercel-cron") !== "1"
  ) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processExpiringSubscriptions();

    return NextResponse.json({
      success: true,
      message: "Subscription lifecycle check completed successfully",
      stats: result,
    });
  } catch (error: any) {
    console.error("[Cron:SubscriptionCheck] Error processing subscriptions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
