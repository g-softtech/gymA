import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { planCode } = body;

    if (!planCode) {
      return NextResponse.json({ error: "Plan code is required" }, { status: 400 });
    }

    let paystackPlan = null;
    if (planCode === "PRO") paystackPlan = process.env.PAYSTACK_PLAN_PRO;
    if (planCode === "ENTERPRISE") paystackPlan = process.env.PAYSTACK_PLAN_ENTERPRISE;

    if (!paystackPlan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    // Call Paystack Initialize API
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: 10000, // Paystack requires amount in Kobo, but if a plan is passed, the plan's amount overrides this. It's safe to pass a placeholder or exact value.
        plan: paystackPlan,
        currency: "NGN",
        metadata: {
          tenantId: tenantId,
        },
        callback_url: `${protocol}://${host}/dashboard/admin/billing?success=true`,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Paystack initialization failed");
    }

    // RETURN ONLY authorization_url. Database is NOT modified.
    return NextResponse.json({ authorization_url: data.data.authorization_url });
  } catch (error: any) {
    console.error("[PAYSTACK_INIT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
