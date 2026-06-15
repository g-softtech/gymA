import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { initializePaystackTransaction } from "@/lib/paystack";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { itemType, itemId } = body;

    if (!itemType || !itemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Resolve pricing and currency based on the requested item
    let amountStr = "0";
    let currency: "NGN" | "USD" = "NGN";
    let itemName = "";
    let metadata: any = {};

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });

    const memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id }
    });
    
    if (!memberProfile) {
      return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
    }

    if (itemType === "MEMBERSHIP") {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: itemId }
      });
      if (!plan || plan.tenantId !== tenantId || !plan.isActive) {
        return NextResponse.json({ error: "Invalid membership plan" }, { status: 400 });
      }
      amountStr = plan.price.toString();
      currency = plan.currency as "NGN" | "USD";
      itemName = `Membership: ${plan.name}`;
      metadata = { planId: plan.id, durationDays: plan.durationDays, planName: plan.name };
    } 
    else if (itemType === "CLASS_BOOKING" || itemType === "TRAINER_SESSION") {
      const booking = await prisma.booking.findUnique({
        where: { id: itemId }
      });
      if (!booking || booking.tenantId !== tenantId || booking.memberId !== memberProfile.id) {
        return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
      }
      if (!booking.paymentRequired || !booking.paymentAmount) {
        return NextResponse.json({ error: "Booking does not require payment" }, { status: 400 });
      }
      amountStr = booking.paymentAmount.toString();
      currency = (tenantSettings?.defaultCurrency || "NGN") as "NGN" | "USD";
      itemName = itemType === "CLASS_BOOKING" ? "Class Booking Payment" : "Trainer Session Payment";
      metadata = { bookingId: booking.id };
    } else {
      return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }

    const amountFloat = parseFloat(amountStr);
    if (amountFloat <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    // 2. Create Immutable Transaction Snapshot
    const reference = `txn_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        memberId: memberProfile.id,
        itemName,
        itemType,
        amount: new Prisma.Decimal(amountFloat),
        currency,
        reference,
        status: "PENDING",
        metadata
      }
    });

    // 4. Initialize Paystack (Paystack expects smallest currency unit, e.g., kobo/cents)
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const paystackAmount = Math.round(amountFloat * 100);
    const callback_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gym/${tenant?.slug}/dashboard/member?payment=verify`;

    const paystackData = await initializePaystackTransaction({
      amount: paystackAmount,
      email: session.user.email || "customer@example.com",
      reference: transaction.reference,
      currency,
      callback_url
    });

    return NextResponse.json({
      checkoutUrl: paystackData.authorization_url,
      accessCode: paystackData.access_code,
      reference: transaction.reference
    });

  } catch (error) {
    console.error("POST /api/payments/initialize error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
