import { prisma } from "./prisma";
import { TenantPlan } from "@prisma/client";

export async function upgradeTenantSaaS(
  tenantId: string,
  plan: TenantPlan,
  amount: number,
  reference: string,
  currency: string = "NGN",
  gateway: string = "PAYSTACK"
) {
  console.log(`[billing-service] Upgrading tenant ${tenantId} to ${plan} via ${reference}`);

  // 1. Idempotency check
  const existingInvoice = await prisma.saaSInvoice.findUnique({
    where: { reference },
  });

  if (existingInvoice) {
    console.log(`[billing-service] Invoice ${reference} already processed.`);
    return;
  }

  // 2. Run transaction to ensure both invoice and tenant update succeed
  await prisma.$transaction(async (tx) => {
    // Create the invoice
    await tx.saaSInvoice.create({
      data: {
        tenantId,
        plan,
        amount,
        currency,
        reference,
        gateway,
        status: "SUCCESS",
      },
    });

    // Calculate new billing end date
    // If they already have an active billing period, add 30 days to it.
    // Otherwise, start 30 days from now.
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Tenant not found");

    const now = new Date();
    let newBillingEndsAt = new Date();
    
    if (tenant.billingEndsAt && tenant.billingEndsAt > now) {
      newBillingEndsAt = new Date(tenant.billingEndsAt);
      newBillingEndsAt.setDate(newBillingEndsAt.getDate() + 30);
    } else if (tenant.trialEndsAt && tenant.trialEndsAt > now) {
      newBillingEndsAt = new Date(tenant.trialEndsAt);
      newBillingEndsAt.setDate(newBillingEndsAt.getDate() + 30);
    } else {
      newBillingEndsAt.setDate(now.getDate() + 30);
    }

    // If upgrading to a new plan, update the planStartedAt if it's different
    const planStartedAt = tenant.plan !== plan ? now : tenant.planStartedAt;

    // Update the tenant
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        plan,
        billingEndsAt: newBillingEndsAt,
        planStartedAt,
      },
    });
  });

  console.log(`[billing-service] ✅ Tenant ${tenantId} successfully upgraded to ${plan}`);
}
