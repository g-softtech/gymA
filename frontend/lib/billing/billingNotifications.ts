/**
 * Billing Notification Consumer
 *
 * This is the ONLY component that sends billing-related notifications.
 * Lifecycle engines and webhooks MUST NOT send notifications directly.
 * They emit events; this consumer reacts to them.
 *
 * Notification types handled:
 *   - SUBSCRIPTION_TRIAL_ENDING  → "Your trial ends soon"
 *   - SUBSCRIPTION_PAST_DUE      → "Payment failed — action required"
 *   - SUBSCRIPTION_SUSPENDED     → "Account suspended"
 *   - SUBSCRIPTION_EXPIRED       → "Subscription expired"
 *   - SUBSCRIPTION_REACTIVATED   → "Welcome back — account restored"
 *
 * In production: replace console.log with Resend / SendGrid / in-app push.
 * The structured JSON log below is compatible with any log aggregator (Datadog,
 * Logtail, Axiom, etc.) and will appear in Vercel Function Logs immediately.
 */

import { subscriptionEventBus } from "@/lib/events/subscriptionEventBus";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/emailService";
import { logger } from "@/lib/logger";

async function logNotification(tenantId: string, type: any, message: string) {
  // Structured JSON log — parseable by any observability platform
  logger.info("Billing Notification Emitted", {
    service: "billingNotificationConsumer",
    tenantId,
    notificationType: type,
    message,
  });

  try {
    const adminUsers = await prisma.user.findMany({ where: { tenantId, role: "ADMIN" } });
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
    const recipientEmail = settings?.email || adminUsers[0]?.email;
    const adminUserId = adminUsers[0]?.id;

    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: `[CortexFit Billing] ${type.replace("_", " ")}`,
        html: `<p>${message}</p>`,
      });
    } else {
      logger.warn(`No admin email found for tenant ${tenantId} to send billing notification.`);
    }

    // Persist in-app notification
    await prisma.notification.create({
      data: {
        tenantId,
        userId: adminUserId || null,
        type: "PAYMENT" as any, // Enum NotificationType has PAYMENT
        title: "Billing Update",
        message,
      }
    });
  } catch (error) {
    logger.error("Failed to process billing notification", error, { tenantId, type });
  }
}

// ── Event Subscriptions ────────────────────────────────────────────────────────

subscriptionEventBus.on("SUBSCRIPTION_TRIAL_ENDING", ({ tenantId }) => {
  logNotification(
    tenantId,
    "TRIAL_ENDING",
    "Your free trial is ending soon. Add a payment method to keep your account active."
  );
});

subscriptionEventBus.on("SUBSCRIPTION_PAST_DUE", ({ tenantId }) => {
  logNotification(
    tenantId,
    "PAST_DUE",
    "Your last payment failed. Please update your billing details to restore full access."
  );
});

subscriptionEventBus.on("SUBSCRIPTION_SUSPENDED", ({ tenantId }) => {
  logNotification(
    tenantId,
    "SUSPENDED",
    "Your account has been suspended due to non-payment. Contact support or update billing to reactivate."
  );
});

subscriptionEventBus.on("SUBSCRIPTION_EXPIRED", ({ tenantId }) => {
  logNotification(
    tenantId,
    "EXPIRED",
    "Your subscription has expired. Renew now to restore access to all features."
  );
});

subscriptionEventBus.on("SUBSCRIPTION_REACTIVATED", ({ tenantId }) => {
  logNotification(
    tenantId,
    "REACTIVATED",
    "Your subscription is active again. Welcome back!"
  );
});

export { logNotification };
