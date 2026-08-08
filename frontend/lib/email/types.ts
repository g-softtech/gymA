// =============================================================================
// CORTEXFIT EMAIL ENGINE — TYPE SYSTEM
// Central type definitions for the email subsystem.
// Business logic MUST import types from here — never hardcode strings.
// =============================================================================

// ── Brand Context ─────────────────────────────────────────────────────────────
// Passed to every email template. Gym-specific emails use the gym's brand;
// platform emails (billing, magic link) fall back to CortexFit defaults.

export interface BrandContext {
  brandName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor?: string;
  supportEmail: string;
  website: string;
  replyTo?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  privacyUrl?: string;
  termsUrl?: string;
  footerText?: string;
}

export const CORTEXFIT_BRAND: BrandContext = {
  brandName: "CortexFit",
  logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com"}/logo.png`,
  primaryColor: "#6366F1",
  secondaryColor: "#8B5CF6",
  supportEmail: "support@thecortexsystems.com",
  website: process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com",
  replyTo: "support@thecortexsystems.com",
  privacyUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com"}/privacy`,
  termsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://fit.thecortexsystems.com"}/terms`,
  footerText: "© 2025 CortexFit. All rights reserved.",
};

// ── Email Type Enum ───────────────────────────────────────────────────────────
// Mirrors the Prisma EmailType enum exactly.

export type EmailType =
  | "MAGIC_LINK"
  | "MEMBER_WELCOME"
  | "GYM_OWNER_WELCOME"
  | "PAYMENT_RECEIPT"
  | "BILLING_REMINDER"
  | "TRIAL_ENDING"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_SUSPENDED"
  | "BOOKING_CONFIRMATION"
  | "BOOKING_REMINDER"
  | "BOOKING_CANCELLED"
  | "MEMBERSHIP_EXPIRING"
  | "PAYMENT_FAILED"
  | "PASSWORD_CHANGED"
  | "TRAINER_INVITATION"
  | "STAFF_INVITATION"
  | "BANK_ACCOUNT_CONNECTED"
  | "NEWSLETTER_WELCOME";

// ── Typed Payload Interfaces ──────────────────────────────────────────────────
// Every EmailJob's `payload` field must conform to one of these interfaces.

export interface MagicLinkPayload {
  recipientName: string;
  magicUrl: string;
  gymName?: string;       // If undefined, this is a platform-level sign-in
  isNewSignup?: boolean;
}

export interface MemberWelcomePayload {
  memberId: string;
  memberName: string;
  gymName: string;
  gymSlug: string;
  magicUrl: string;        // Magic link to the member portal
  planName?: string;
}

export interface GymOwnerWelcomePayload {
  ownerName: string;
  gymName: string;
  gymSlug: string;
  dashboardUrl: string;
  magicUrl?: string;   // If provided, the "Go to Dashboard" button logs the user in automatically
}

export interface PaymentReceiptPayload {
  memberName: string;
  receiptNumber: string;
  transactionReference: string;
  planName: string;
  amountFormatted: string;
  paymentDate: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  gymName: string;
  gymSupportEmail?: string;
}

export interface BillingReminderPayload {
  ownerName: string;
  gymName: string;
  invoiceId: string;
  amountDue: string;
  dueDate: string;
  paymentUrl: string;
}

export interface TrialEndingPayload {
  ownerName: string;
  gymName: string;
  trialEndsAt: string;
  daysRemaining: number;
  upgradeUrl: string;
}

export interface SubscriptionActivatedPayload {
  ownerName: string;
  gymName: string;
  planName: string;
  amountPaid: string;
  billingPeriodEnd: string;
  dashboardUrl: string;
}

export interface BookingConfirmationPayload {
  memberName: string;
  className: string;
  instructorName: string;
  classDate: string;
  classTime: string;
  gymName: string;
  cancellationPolicy?: string;
}

export interface BookingReminderPayload {
  memberName: string;
  className: string;
  instructorName: string;
  classDate: string;
  classTime: string;
  gymName: string;
}

export interface BankAccountConnectedPayload {
  ownerName: string;
  gymName: string;
  bankName: string;
  accountNumberLast4: string;
  dashboardUrl: string;
}

export interface StaffInvitationPayload {
  recipientName: string;
  inviterName: string;
  gymName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

export interface NewsletterWelcomePayload {
  subscriberEmail: string;
  unsubscribeUrl?: string; // For future implementation
}

// ── Generic Email Queue Entry ─────────────────────────────────────────────────

export interface EmailQueueEntry<T = Record<string, unknown>> {
  emailType: EmailType;
  recipient: string;
  subject: string;
  payload: T;
  tenantId?: string;
  userId?: string;
  eventId?: string;
}

// ── Template Version (increment when making breaking visual changes) ───────────
export const TEMPLATE_VERSION = "v1";
