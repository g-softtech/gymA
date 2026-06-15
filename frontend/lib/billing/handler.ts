import { prisma } from "@/lib/prisma";

export async function handlePaystackWebhook(event: any) {
  const { event: eventType, data } = event;

  console.log(`[PAYSTACK WEBHOOK] Processing event: ${eventType}`);

  switch (eventType) {
    case "subscription.create": {
      const tenantId = data.metadata?.tenantId;
      if (!tenantId) break;

      const planCode = data.plan.plan_code;
      let plan = "FREE";
      if (planCode === process.env.PAYSTACK_PLAN_PRO) plan = "PRO";
      if (planCode === process.env.PAYSTACK_PLAN_ENTERPRISE) plan = "ENTERPRISE";

      await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: data.status,
          paystackCustomerCode: data.customer.customer_code,
          paystackSubscriptionCode: data.subscription_code,
          paystackEmailToken: data.email_token,
          currentPeriodEnd: new Date(data.next_payment_date),
        },
      });
      break;
    }

    case "charge.success": {
      const tenantId = data.metadata?.tenantId;
      if (!tenantId) break;

      // Charge success might happen on initial payment or renewal. 
      // If it's a subscription charge, we extend the period.
      // Paystack usually handles subscription dates via 'subscription.create' 
      // or 'invoice.create', but it's good to ensure the status is active.
      await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          subscriptionStatus: "active",
        },
      });
      break;
    }

    case "subscription.disable":
    case "subscription.not_renew": {
      const subscriptionCode = data.subscription_code;
      if (!subscriptionCode) break;

      // Graceful downgrade. We keep the customDomain but lower the plan.
      // We also set domainVerified to false per requirements.
      await prisma.tenantSettings.update({
        where: { paystackSubscriptionCode: subscriptionCode },
        data: {
          subscriptionPlan: "FREE",
          subscriptionStatus: "inactive",
          domainVerified: false, 
        },
      });
      break;
    }

    case "invoice.create": {
      // Handles renewals successfully
      const subscriptionCode = data.subscription.subscription_code;
      if (!subscriptionCode) break;

      await prisma.tenantSettings.update({
        where: { paystackSubscriptionCode: subscriptionCode },
        data: {
          subscriptionStatus: "active",
          currentPeriodEnd: new Date(data.period_end),
        },
      });
      break;
    }

    default:
      console.log(`[PAYSTACK WEBHOOK] Unhandled event: ${eventType}`);
  }
}
