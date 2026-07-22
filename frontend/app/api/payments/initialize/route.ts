import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { initializePaystackTransaction } from "@/lib/paystack";
import { Prisma } from "@prisma/client";
import { RENEWAL_WINDOW_DAYS } from "@/lib/billing/pricingConfig";

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
        return NextResponse.json({ error: "Invalid or inactive membership plan" }, { status: 400 });
      }

      // Check current subscription for upgrade/downgrade logic
      const currentActiveSub = await prisma.subscription.findFirst({
        where: {
          memberId: memberProfile.id,
          tenantId,
          status: "ACTIVE",
          endDate: { gt: new Date() },
        },
        include: { plan: true },
        orderBy: { endDate: "desc" },
      });

      if (currentActiveSub) {
        const activePlanPrice = Number(currentActiveSub.plan.price);
        const targetPlanPrice = Number(plan.price);
        const isUpgrade = targetPlanPrice > activePlanPrice;
        const isDowngrade = targetPlanPrice < activePlanPrice;
        const isLateral = !isUpgrade && !isDowngrade && plan.id !== currentActiveSub.planId;
        const isSamePlan = plan.id === currentActiveSub.planId;

        if (isDowngrade) {
          return NextResponse.json({ error: "Downgrades are not allowed via this flow" }, { status: 400 });
        }

        if (isSamePlan || isLateral) {
          // Only allow if near expiry
          const daysLeft = (new Date(currentActiveSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          if (daysLeft > RENEWAL_WINDOW_DAYS) {
            return NextResponse.json({ error: "Plan renewal/lateral move not allowed until near expiry" }, { status: 400 });
          }
        }
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

    const safeEmail = (session.user.email && session.user.email.includes("@")) 
      ? session.user.email.trim() 
      : `guest_${session.user.id.substring(0, 8)}@sandbox.local`;

    const paystackData = await initializePaystackTransaction({
      amount: paystackAmount,
      email: safeEmail,
      reference: transaction.reference,
      currency,
      callback_url
    });

    return NextResponse.json({
      checkoutUrl: paystackData.authorization_url,
      accessCode: paystackData.access_code,
      reference: transaction.reference
    });

  } catch (err: any) {
    console.error("[POST /api/payments/initialize]", err);
    return NextResponse.json({ 
      error: `[INIT ERROR]: ${err?.message || String(err)}` 
    }, { status: 500 });
  }
}
