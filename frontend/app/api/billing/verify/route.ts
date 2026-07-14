import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { handleSubscriptionSuccess } from "../../webhooks/platform-billing/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await req.json();

    if (!reference || !reference.startsWith("PLATFORM_")) {
      return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
    }

    // Call Paystack REST API to verify payment
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Call the reliable logic to update the DB immediately
    await handleSubscriptionSuccess(paystackData.data);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Platform Payment verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
