"use server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializePaystackTransaction } from "@/lib/paystack";
import { TenantPlan } from "@prisma/client";

export async function initializeSaaSCheckout(tenantId: string, targetPlan: TenantPlan) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email || session.user.role !== "SUPERADMIN" && session.user.tenantId !== tenantId) {
      throw new Error("Unauthorized to perform this action.");
    }

    // Determine price based on plan (example prices in NGN kobo)
    // Starter: ₦100,000 = 10,000,000 kobo
    // Growth: ₦200,000 = 20,000,000 kobo
    // Enterprise: ₦500,000 = 50,000,000 kobo
    let amountKobo = 0;
    if (targetPlan === "STARTER") amountKobo = 10000000;
    else if (targetPlan === "GROWTH") amountKobo = 20000000;
    else if (targetPlan === "ENTERPRISE") amountKobo = 50000000;
    else throw new Error("Invalid target plan.");

    const reference = `saas_${tenantId}_${targetPlan}_${Date.now()}`;

    // Initialize Paystack Checkout
    const paystackResponse = await initializePaystackTransaction({
      amount: amountKobo,
      email: session.user.email,
      reference,
      currency: "NGN",
      // Redirect back to billing page after successful payment
      callback_url: `${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/admin/billing`,
      metadata: {
        tenantId,
        targetPlan,
        checkoutType: "SAAS_UPGRADE"
      }
    });

    return {
      success: true,
      authorizationUrl: paystackResponse.authorization_url,
      reference: paystackResponse.reference
    };

  } catch (error: any) {
    console.error("Failed to initialize SaaS checkout:", error);
    return {
      success: false,
      error: error.message || "Failed to initialize checkout."
    };
  }
}
