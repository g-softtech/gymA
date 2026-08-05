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

    if (process.env.DEMO_MODE === "true") {
      const { prisma } = await import("@/lib/prisma");
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
        include: { tenant: true }
      });
      if (transaction && (process.env.DEMO_MODE === "true" || transaction.tenant?.isDemo)) {
        const fulfillResult = await fulfillPayment(reference, {
          amountKobo: Number(transaction.amount) * 100,
          currency: transaction.currency,
          rawResponse: { status: "success", simulated: true, message: "Demo Mode: Payment simulation completed successfully." },
        });
        return NextResponse.json({ ...fulfillResult, demoSimulated: true, message: "Demo Mode: Payment simulation completed successfully." });
      }
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

    return NextResponse.json(fulfillResult);
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json({ 
      error: `[VERIFY ERROR]: ${err?.message || String(err)}` 
    }, { status: 500 });
  }
}