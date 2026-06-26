import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { fulfillPayment } from "@/lib/paymentFulfillment";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Call Paystack REST API to verify payment (Authoritative check for client route)
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

    // Call our robust, idempotent fulfillment service
    const fulfillResult = await fulfillPayment(reference, {
      amountKobo: paystackData.data.amount,
      currency: paystackData.data.currency,
      rawResponse: paystackData.data,
    });

    return NextResponse.json({ success: true, ...fulfillResult });
  } catch (err) {
    console.error("Payment verification error:", err);
    return NextResponse.json({ error: "Internal server error or validation failure" }, { status: 500 });
  }
}