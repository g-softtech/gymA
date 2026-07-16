import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { PLATFORM_PLANS, PlatformPlanCode } from "@/lib/billing/pricingConfig";
import { prisma } from "@/lib/prisma";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { planCode } = body;

    if (!planCode) {
      return NextResponse.json({ error: "Plan code is required" }, { status: 400 });
    }

    const platformPlan = PLATFORM_PLANS[planCode as PlatformPlanCode];
    if (!platformPlan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    if (platformPlan.amountNGN <= 0) {
      return NextResponse.json({ error: "Free plans do not require payment" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    
    // Fetch tenant to get the slug for the callback URL
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    const slug = tenant.slug;

    // Generate a unique reference so our webhook can handle atomic provisioning
    const reference = `PLATFORM_${planCode}_${tenantId}_${Date.now()}`;

    // Create a pending invoice in the DB to serve as the source of truth
    await prisma.saaSInvoice.create({
      data: {
        tenantId,
        amount: platformPlan.amountNGN,
        status: "pending",
        reference,
      }
    });

    // Call Paystack Initialize API
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: platformPlan.amountNGN * 100, // strictly enforce config price (in kobo)
        currency: "NGN",
        reference,
        // Metadata is no longer relied upon for routing or security
        metadata: {
          tenantId: tenantId,
          planCode: platformPlan.code,
        },
        callback_url: `${protocol}://${host}/gym/${slug}/dashboard/admin/billing?success=true`,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Paystack initialization failed");
    }

    // RETURN ONLY authorization_url.
    return NextResponse.json({ authorization_url: data.data.authorization_url });
  } catch (error: any) {
    console.error("[PAYSTACK_INIT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
