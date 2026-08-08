// =============================================================================
// CORTEXFIT EMAIL ENGINE — TEMPLATE REGISTRY
// Every email type maps to exactly one React template function.
// Worker uses this registry — no switch statements anywhere.
// =============================================================================

import React from "react";
import type { EmailType, BrandContext } from "./types";

import {
  MagicLinkTemplate,
  MemberWelcomeTemplate,
  GymOwnerWelcomeTemplate,
  PaymentReceiptTemplate,
  BillingReminderTemplate,
  TrialEndingTemplate,
  SubscriptionActivatedTemplate,
  BankAccountConnectedTemplate,
} from "./templates/Tier1Templates";

import { NewsletterWelcomeTemplate } from "./templates/NewsletterWelcome";

// ── Registry Type ─────────────────────────────────────────────────────────────

type TemplateRenderer = (payload: Record<string, unknown>, brand: BrandContext) => React.ReactElement;

const EMAIL_TEMPLATES: Partial<Record<EmailType, TemplateRenderer>> = {
  MAGIC_LINK: (payload, brand) =>
    React.createElement(MagicLinkTemplate, { payload: payload as any, brand }),

  MEMBER_WELCOME: (payload, brand) =>
    React.createElement(MemberWelcomeTemplate, { payload: payload as any, brand }),

  GYM_OWNER_WELCOME: (payload, brand) =>
    React.createElement(GymOwnerWelcomeTemplate, { payload: payload as any, brand }),

  PAYMENT_RECEIPT: (payload, brand) =>
    React.createElement(PaymentReceiptTemplate, { payload: payload as any, brand }),

  BILLING_REMINDER: (payload, brand) =>
    React.createElement(BillingReminderTemplate, { payload: payload as any, brand }),

  TRIAL_ENDING: (payload, brand) =>
    React.createElement(TrialEndingTemplate, { payload: payload as any, brand }),

  SUBSCRIPTION_ACTIVATED: (payload, brand) =>
    React.createElement(SubscriptionActivatedTemplate, { payload: payload as any, brand }),

  BANK_ACCOUNT_CONNECTED: (payload, brand) =>
    React.createElement(BankAccountConnectedTemplate, { payload: payload as any, brand }),

  NEWSLETTER_WELCOME: (payload, brand) =>
    React.createElement(NewsletterWelcomeTemplate, { payload: payload as any, brand }),

  // Phase 2 — placeholder until templates are built
  BOOKING_CONFIRMATION: (payload, brand) =>
    React.createElement(MagicLinkTemplate, { payload: { recipientName: "", magicUrl: "#" }, brand }),

  BOOKING_REMINDER: (payload, brand) =>
    React.createElement(MagicLinkTemplate, { payload: { recipientName: "", magicUrl: "#" }, brand }),
};

/**
 * Resolves the React element for an email type.
 * Throws if the email type has no registered template.
 */
export function resolveTemplate(
  emailType: EmailType,
  payload: Record<string, unknown>,
  brand: BrandContext
): React.ReactElement {
  const renderer = EMAIL_TEMPLATES[emailType];
  if (!renderer) {
    throw new Error(`[EmailTemplateRegistry] No template registered for email type: ${emailType}`);
  }
  return renderer(payload, brand);
}
