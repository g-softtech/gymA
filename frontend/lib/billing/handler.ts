import { prisma } from "@/lib/prisma";
import { PLATFORM_PLANS, PlatformPlanCode } from "@/lib/billing/pricingConfig";
import { SaaSInvoice } from "@prisma/client";

export async function handlePaystackWebhook(event: any, invoice: SaaSInvoice) {
  const { event: eventType, data } = event;

  console.log(`[PAYSTACK WEBHOOK] Processing event: ${eventType} for Platform Invoice: ${invoice.reference}`);

  if (eventType === "charge.success") {
    // Determine planCode and tenantId from the securely generated reference 
    // Format: PLATFORM_{planCode}_{tenantId}_{timestamp}
    const parts = invoice.reference.split("_");
    const planCode = parts[1] as PlatformPlanCode;
    const tenantId = invoice.tenantId;

    if (!tenantId || !planCode) {
      console.error("[PAYSTACK WEBHOOK] Failed to parse tenantId or planCode from reference");
      return;
    }

    const planConfig = PLATFORM_PLANS[planCode];
    if (!planConfig) {
      console.error(`[PAYSTACK WEBHOOK] Invalid planCode in reference: ${planCode}`);
      return;
    }

    // Verify amount matches exactly what we stored in the invoice
    // (And invoice amount was generated purely on the backend from pricingConfig)
    const expectedAmountKobo = Math.round(Number(invoice.amount) * 100);
    if (data.amount !== expectedAmountKobo) {
      console.error(`[PAYSTACK WEBHOOK] Amount mismatch. Expected ${expectedAmountKobo}, got ${data.amount}`);
      return;
    }

    // Atomically fulfill the invoice to guarantee idempotency
    await prisma.$transaction(async (tx) => {
      // 1. Mark invoice as paid, ensuring it is currently pending (Idempotency Check)
      const updatedInvoice = await tx.saaSInvoice.updateMany({
        where: { id: invoice.id, status: "pending" },
        data: { status: "paid" }
      });

      if (updatedInvoice.count === 0) {
        console.warn(`[PAYSTACK WEBHOOK] Invoice ${invoice.reference} already processed or not pending.`);
        return; // Idempotent return
      }

      // 2. Fetch existing settings
      const settings = await tx.tenantSettings.findUnique({
        where: { tenantId }
      });

      if (!settings) {
        throw new Error(`TenantSettings not found for tenant: ${tenantId}`);
      }

      // 3. Calculate new period end
      const now = new Date();
      let startDate = now;
      if (settings.currentPeriodEnd && settings.currentPeriodEnd > now && settings.subscriptionPlan === planCode) {
        startDate = new Date(settings.currentPeriodEnd);
      } else {
        startDate = now;
      }

      const newPeriodEnd = new Date(startDate);
      if (planConfig.interval === "year") {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }

      // 4. Update tenant settings
      await tx.tenantSettings.update({
        where: { tenantId },
        data: {
          subscriptionPlan: planCode,
          subscriptionStatus: "active",
          currentPeriodEnd: newPeriodEnd,
        },
      });

      // 5. Update Tenant model
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          plan: planCode === "FREE" ? "FREE" : (planCode === "PRO" ? "STARTER" : "ENTERPRISE"),
          billingEndsAt: newPeriodEnd,
          isActive: true,
        }
      });
      
      console.log(`[PAYSTACK WEBHOOK] SaaS Payment successful for tenant ${tenantId}. Upgraded to ${planCode} until ${newPeriodEnd.toISOString()}`);
    });
  }
}
