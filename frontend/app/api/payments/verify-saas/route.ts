import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { upgradeTenantSaaS } from "@/lib/billing-service";
import { TenantPlan } from "@prisma/client";

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

    const customFields = paystackData.data.metadata?.custom_fields ?? [];
    const tenantId = customFields.find((f: any) => f.variable_name === "tenant_id")?.value;
    const planName = customFields.find((f: any) => f.variable_name === "plan_name")?.value as TenantPlan;
    const amount = paystackData.data.amount / 100;
    const currency = paystackData.data.currency;

    if (!tenantId || !planName) {
      return NextResponse.json({ error: "Invalid metadata in payment" }, { status: 400 });
    }

    // Call our billing service (it is idempotent so it handles webhook races perfectly)
    await upgradeTenantSaaS(tenantId, planName, amount, reference, currency, "PAYSTACK");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SaaS Payment verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
