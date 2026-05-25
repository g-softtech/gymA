
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference, planId, tenantSlug } = await req.json();

    if (!reference || !planId || !tenantSlug) {
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

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
      include: { tenant: true },
    });

    if (!plan || plan.tenant.slug !== tenantSlug) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    let memberProfile = await prisma.memberProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!memberProfile) {
      memberProfile = await prisma.memberProfile.create({
        data: { userId: session.user.id, fitnessGoals: [] },
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await prisma.subscription.create({
      data: {
        memberId: memberProfile.id,
        planId: plan.id,
        startDate,
        endDate,
        status: "ACTIVE",
        paymentGatewayId: reference,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payment verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}