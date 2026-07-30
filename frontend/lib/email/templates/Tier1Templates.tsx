// =============================================================================
// CORTEXFIT EMAIL ENGINE — TIER 1 TEMPLATES
// =============================================================================

import React from "react";
import type { BrandContext, MagicLinkPayload, MemberWelcomePayload, GymOwnerWelcomePayload, PaymentReceiptPayload, BillingReminderPayload, TrialEndingPayload, SubscriptionActivatedPayload, BankAccountConnectedPayload } from "../types";
import {
  EmailLayout, Header, Body, Footer,
  H1, Text, Button, InfoCard, Section, Divider, Spacer, WarningBox, SuccessBox,
} from "../components/EmailComponents";

// =============================================================================
// MAGIC LINK
// =============================================================================

export function MagicLinkTemplate({
  payload,
  brand,
}: {
  payload: MagicLinkPayload;
  brand: BrandContext;
}) {
  const greeting = payload.recipientName ? `Hi ${payload.recipientName},` : "Hi there,";
  const preview = payload.isNewSignup
    ? `Finish setting up ${payload.gymName ?? "your workspace"} — click to verify your email.`
    : `Your secure sign-in link for ${payload.gymName ?? brand.brandName}.`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>{payload.isNewSignup ? "Verify your email" : "Your sign-in link"}</H1>
        <Spacer h={8} />
        <Text>{greeting}</Text>
        <Text>
          {payload.isNewSignup
            ? `You're almost ready to launch ${payload.gymName ?? "your workspace"} on ${brand.brandName}. Click the button below to verify your email address and complete your account setup.`
            : `You requested a secure sign-in link${payload.gymName ? ` for ${payload.gymName}` : ""}. Click the button below — no password needed.`}
        </Text>
        <Button href={payload.magicUrl} brand={brand}>
          {payload.isNewSignup ? `🚀 Launch ${payload.gymName ?? "Workspace"}` : "Sign In Securely"}
        </Button>
        <Divider />
        <WarningBox>
          This link expires in 24 hours and can only be used once. If you didn't request this email, you can safely ignore it.
        </WarningBox>
        <Text size={13} color="#6B7280" mb={0}>
          Button not working? Copy and paste this URL into your browser:
          <br />
          <a href={payload.magicUrl} style={{ color: brand.primaryColor, wordBreak: "break-all", fontSize: 12 }}>
            {payload.magicUrl}
          </a>
        </Text>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}

// =============================================================================
// MEMBER WELCOME
// =============================================================================

export function MemberWelcomeTemplate({
  payload,
  brand,
}: {
  payload: MemberWelcomePayload;
  brand: BrandContext;
}) {
  const preview = `Welcome to ${payload.gymName}! Your member portal is ready.`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Welcome to {payload.gymName}! 🎉</H1>
        <Spacer h={8} />
        <Text>Hi {payload.memberName},</Text>
        <Text>
          You've been added as a member of <strong>{payload.gymName}</strong>. Your personal member portal is now ready — track your attendance, view your membership, and manage your bookings all in one place.
        </Text>
        {payload.planName && (
          <Section mt={16}>
            <InfoCard label="Membership Plan" value={payload.planName} />
          </Section>
        )}
        <Button href={payload.magicUrl} brand={brand}>
          Access My Member Portal →
        </Button>
        <Divider />
        <Text size={14} color="#6B7280">
          This link will sign you in automatically — no password required. If you have any questions, contact your gym directly at{" "}
          <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.primaryColor }}>
            {brand.supportEmail}
          </a>
          .
        </Text>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}

// =============================================================================
// GYM OWNER WELCOME
// =============================================================================

export function GymOwnerWelcomeTemplate({
  payload,
  brand,
}: {
  payload: GymOwnerWelcomePayload;
  brand: BrandContext;
}) {
  const preview = `${payload.gymName} is live on CortexFit! Here's how to get started.`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Your gym is live! 🏆</H1>
        <Spacer h={8} />
        <Text>Hi {payload.ownerName},</Text>
        <Text>
          <strong>{payload.gymName}</strong> has been successfully provisioned on {brand.brandName}. You now have a full gym management platform ready for your members.
        </Text>
        <SuccessBox>
          🔗 Your workspace URL:{" "}
          <a
            href={`${brand.website}/gym/${payload.gymSlug}/dashboard/admin`}
            style={{ color: "#065F46", fontWeight: 600 }}
          >
            {brand.website}/gym/{payload.gymSlug}
          </a>
        </SuccessBox>

        <Section mt={24}>
          <Text size={15} color="#374151" mb={12}>
            <strong>Here's your getting started checklist:</strong>
          </Text>
          <InfoCard label="Step 1" value="Connect your bank account to start receiving member payments" />
          <Spacer h={6} />
          <InfoCard label="Step 2" value="Create your membership plans with pricing and durations" />
          <Spacer h={6} />
          <InfoCard label="Step 3" value="Import your members or invite them with a magic link" />
          <Spacer h={6} />
          <InfoCard label="Step 4" value="Upload your gym logo and customize your brand colors" />
          <Spacer h={6} />
          <InfoCard label="Step 5" value="Invite your trainers and front desk staff" />
        </Section>

        <Button href={payload.dashboardUrl} brand={brand}>
          Go to My Dashboard →
        </Button>

        <Divider />

        <Text size={14} color="#6B7280" mb={8}>
          <strong>Need help?</strong> Our support team is here for you.
        </Text>
        <Text size={13} color="#9CA3AF" mb={0}>
          Reply to this email or contact us at{" "}
          <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.primaryColor }}>
            {brand.supportEmail}
          </a>
        </Text>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}

// =============================================================================
// PAYMENT RECEIPT
// =============================================================================

export function PaymentReceiptTemplate({
  payload,
  brand,
}: {
  payload: PaymentReceiptPayload;
  brand: BrandContext;
}) {
  const preview = `Payment receipt ${payload.receiptNumber} — ${payload.amountFormatted} received.`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Payment Confirmed ✓</H1>
        <Spacer h={8} />
        <Text>Hi {payload.memberName},</Text>
        <Text>
          Thank you! We've received your payment for your <strong>{payload.planName}</strong> membership at {payload.gymName}.
        </Text>

        <SuccessBox>
          <strong>Amount Paid: {payload.amountFormatted}</strong>
        </SuccessBox>

        <Section mt={16}>
          <InfoCard label="Receipt Number" value={payload.receiptNumber} />
          <Spacer h={6} />
          <InfoCard label="Transaction Reference" value={payload.transactionReference} />
          <Spacer h={6} />
          <InfoCard label="Payment Date" value={payload.paymentDate} />
          <Spacer h={6} />
          <InfoCard label="Membership Period" value={`${payload.subscriptionStart} → ${payload.subscriptionEnd}`} />
        </Section>

        <Divider />

        <Text size={14} color="#6B7280" mb={0}>
          Keep this email as your payment record. For questions about your membership, contact {payload.gymName} at{" "}
          <a
            href={`mailto:${payload.gymSupportEmail ?? brand.supportEmail}`}
            style={{ color: brand.primaryColor }}
          >
            {payload.gymSupportEmail ?? brand.supportEmail}
          </a>
          .
        </Text>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}

// =============================================================================
// BILLING REMINDER
// =============================================================================

export function BillingReminderTemplate({
  payload,
  brand,
}: {
  payload: BillingReminderPayload;
  brand: BrandContext;
}) {
  const preview = `Action required: ${payload.amountDue} due for your ${brand.brandName} subscription.`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Payment Required</H1>
        <Spacer h={8} />
        <Text>Hi {payload.ownerName},</Text>
        <Text>
          Your {brand.brandName} subscription for <strong>{payload.gymName}</strong> has an outstanding balance. Please complete your payment to avoid service interruption.
        </Text>

        <WarningBox>
          <strong>Amount Due: {payload.amountDue}</strong>
          <br />
          Due Date: {payload.dueDate}
        </WarningBox>

        <Button href={payload.paymentUrl} brand={brand}>
          Pay Now →
        </Button>

        <Divider />
        <Text size={14} color="#6B7280" mb={0}>
          If you've already made this payment, please disregard this notice. Contact us at{" "}
          <a href={`mailto:${brand.supportEmail}`} style={{ color: brand.primaryColor }}>
            {brand.supportEmail}
          </a>{" "}
          if you have any questions.
        </Text>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}

// =============================================================================
// TRIAL ENDING
// =============================================================================

export function TrialEndingTemplate({
  payload,
  brand,
}: {
  payload: TrialEndingPayload;
  brand: BrandContext;
}) {
  const preview = `Your ${brand.brandName} trial ends in ${payload.daysRemaining} day${payload.daysRemaining === 1 ? "" : "s"}.`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Your trial ends soon ⏰</H1>
        <Spacer h={8} />
        <Text>Hi {payload.ownerName},</Text>
        <Text>
          Your free trial for <strong>{payload.gymName}</strong> on {brand.brandName} expires in{" "}
          <strong>{payload.daysRemaining} day{payload.daysRemaining === 1 ? "" : "s"}</strong> on{" "}
          <strong>{payload.trialEndsAt}</strong>.
        </Text>
        <Text>
          After your trial ends, your workspace will be locked. Upgrade now to continue managing your gym without interruption.
        </Text>

        <Button href={payload.upgradeUrl} brand={brand}>
          Upgrade My Plan →
        </Button>

        <Divider />
        <Text size={14} color="#6B7280" mb={0}>
          Questions about pricing? Reply to this email or visit{" "}
          <a href={`${brand.website}/pricing`} style={{ color: brand.primaryColor }}>
            our pricing page
          </a>
          .
        </Text>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}

// =============================================================================
// SUBSCRIPTION ACTIVATED
// =============================================================================

export function SubscriptionActivatedTemplate({
  payload,
  brand,
}: {
  payload: SubscriptionActivatedPayload;
  brand: BrandContext;
}) {
  const preview = `${payload.planName} plan activated for ${payload.gymName}. You're all set!`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Subscription Activated 🎉</H1>
        <Spacer h={8} />
        <Text>Hi {payload.ownerName},</Text>
        <Text>
          Your <strong>{payload.planName}</strong> subscription for <strong>{payload.gymName}</strong> is now active!
        </Text>

        <SuccessBox>
          <strong>{payload.planName} plan is live</strong>
          <br />
          All features are unlocked and ready to use.
        </SuccessBox>

        <Section mt={16}>
          <InfoCard label="Amount Paid" value={payload.amountPaid} />
          <Spacer h={6} />
          <InfoCard label="Billing Renews" value={payload.billingPeriodEnd} />
        </Section>

        <Button href={payload.dashboardUrl} brand={brand}>
          Go to Dashboard →
        </Button>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}

// =============================================================================
// BANK ACCOUNT CONNECTED
// =============================================================================

export function BankAccountConnectedTemplate({
  payload,
  brand,
}: {
  payload: BankAccountConnectedPayload;
  brand: BrandContext;
}) {
  const preview = `Bank account connected — ${payload.gymName} is ready to accept member payments.`;

  return (
    <EmailLayout preview={preview}>
      <Header brand={brand} />
      <Body>
        <H1>Bank Account Connected ✓</H1>
        <Spacer h={8} />
        <Text>Hi {payload.ownerName},</Text>
        <Text>
          Your bank account has been successfully connected to <strong>{payload.gymName}</strong>. Member payments will now be deposited directly to your account.
        </Text>

        <SuccessBox>
          <strong>{payload.bankName}</strong> •••• {payload.accountNumberLast4}
          <br />
          Payouts are enabled. CortexFit charges 0% commission.
        </SuccessBox>

        <Button href={payload.dashboardUrl} brand={brand}>
          View Payout Settings →
        </Button>

        <Divider />
        <WarningBox>
          If you did not connect this bank account, please contact us immediately at{" "}
          <a href={`mailto:${brand.supportEmail}`} style={{ color: "#92400E" }}>
            {brand.supportEmail}
          </a>
          .
        </WarningBox>
      </Body>
      <Footer brand={brand} />
    </EmailLayout>
  );
}
