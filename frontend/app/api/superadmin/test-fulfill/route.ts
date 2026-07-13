import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillPayment } from "@/lib/paymentFulfillment";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "No ref" });

  try {
    const tx = await prisma.transaction.findUnique({ where: { reference: ref } });
    if (!tx) return NextResponse.json({ error: "Tx not found" });

    const result = await fulfillPayment(ref, {
      amountKobo: Math.round(Number(tx.amount) * 100),
      currency: tx.currency,
      rawResponse: { status: "success", amount: Math.round(Number(tx.amount) * 100) }
    });

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  }
}
