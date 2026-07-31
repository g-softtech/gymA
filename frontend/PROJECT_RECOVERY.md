# PROJECT_RECOVERY.md: CortexFit Reference Architecture Recovery Audit

## Table of Contents
1. [Phase 1: Repository Inventory](#phase-1-repository-inventory)
2. [Phase 2: Prisma Audit](#phase-2-prisma-audit)
3. [Phase 3: Architecture Recovery](#phase-3-architecture-recovery)
4. [Phase 4: Operational Features](#phase-4-operational-features)
5. [Phase 5: Security Audit](#phase-5-security-audit)
6. [Phase 6: Current Roadmap Recovery](#phase-6-current-roadmap-recovery)
7. [Phase 7: Technical Debt](#phase-7-technical-debt)
8. [Phase 8: Recovery Report & Operating Manual](#phase-8-recovery-report--operating-manual)

---

## Phase 1: Repository Inventory

### Core Subsystems Status
- **Authentication**: Fully implemented. Passwordless Magic Links via NextAuth (`EmailProvider`). Session JWT 30-day expiry. Role-based (SUPERADMIN, ADMIN, TRAINER, MEMBER).
- **Billing**: Fully implemented. Single source of truth in `pricingConfig.ts`. Paystack integration for SaaS & Member billing. Unified webhook at `/api/payments/webhook` & `/api/webhooks/paystack`.
- **Entitlements**: Implemented. Tracked via `EntitlementLog` and `MembershipPlan.entitlements` JSON fields.
- **Admissions & Check-in**: Implemented. Supports QR, MANUAL, and PIN methods (`Attendance` & `AttendanceEvent` models).
- **Members**: Implemented via `MemberProfile` aggregating weights, workouts, goals, and nutrition.
- **Trainers**: Implemented via `TrainerProfile` aggregating classes, availability, and bookings.
- **QR Scanner**: Implemented via `@yudiel/react-qr-scanner` and `html5-qrcode` in package.json. `lastQrNonce` stored on `MemberProfile`.
- **Notifications**: Implemented via `Notification` model and `AdminNotificationLog`.
- **Email**: Implemented. Uses Resend & Nodemailer. Managed via `EmailJob` and `EmailLog` tables. Event-driven queue via `/api/workers/email-worker`.
- **Receipts**: Implemented via `Receipt` and `ReceiptSequence` to track sequential invoice numbers per tenant.
- **Reports**: Active. Superadmin revenue endpoints and tenant-level intelligence ops metrics exist.
- **Event Bus**: Implemented strictly for the subscription domain (`lib/subscriptions/events/*`). Synchronous execution inside Vercel functions (ADR-002).
- **Background Workers**: Vercel Serverless based workers (`/api/workers/email-worker`). No dedicated long-running processes. Triggered via Cron or inline fetches.
- **Webhooks**: Active. Paystack webhooks located at `/api/webhooks/paystack` and platform-billing.
- **File Storage**: Active. Cloudinary integration (`cloudinary` in package.json) for image uploads.
- **Analytics**: Partial/Advanced. "Intelligence Ops Metrics" heavily implemented for A/B testing and Bayesian models (Phase 7-10 schema).
- **Website Builder**: Basic structure. `TenantSettings` contains JSON fields for `heroData`, `aboutData`, `servicesData`, `homepageLayout`.
- **AI**: Active. Uses `@ai-sdk/google` (Gemini 2.0 Flash) for workouts, nutrition, and chat (tracked in `AiLog`).
- **Security**: Advanced. Edge middleware routing, strict NextAuth policy (ADR-011), Upstash Ratelimiting by IP and User ID.
- **Audit**: Comprehensive. `AuditLog` table for general events, `IntelligenceActionLog` for AI actions.
- **Multi-tenancy**: Strict. Every model has a `tenantId`. Hostname resolution via middleware routing.
- **Dashboard**: Active. Separate views for Admin, Trainer, and Member.
- **Marketing Site**: Active. Basic Next.js marketing routes.

### Known Limitations
- Background processing relies entirely on Vercel's serverless timeout windows and synchronous event bus awaits.
- No websocket infrastructure; real-time check-in updates likely require polling.

---

## Phase 2: Prisma Audit

### Key Models & Aggregates
- **Core Multi-tenancy**: `Tenant`, `TenantSettings` (huge aggregate config), `User`, `Account`, `Session`.
- **Domain: Gym Operations**: `MemberProfile`, `TrainerProfile`, `MembershipPlan`, `Subscription`, `ClassSession`, `Booking`, `Attendance`, `AttendanceEvent`.
- **Domain: Progress & AI**: `WorkoutPlan`, `MealPlan`, `FoodLog`, `ProgressRecord`, `AiLog`.
- **Domain: Community**: `Post`, `PostLike`, `Comment`, `Challenge`, `ChallengeEntry`, `Badge`.
- **Domain: Billing**: `SaaSInvoice`, `BillingEvent`, `Transaction`, `PaymentEvent`, `Receipt`, `ReceiptSequence`.
- **Domain: Intelligence & Experimentation**: `IntelligenceActionLog`, `IntelligenceOpsMetrics`, `TenantIntelligenceMetrics`, `IntelligenceExperiment`, `ExperimentAssignment`, `ExperimentOutcome`, `ExperimentSnapshot`, `IntelligenceVersionRegistry`, `IntelligencePromotionLog`, `IntelligenceSafetyEvent`.
- **Domain: Operational Logs**: `EmailJob`, `EmailLog`, `AuditLog`, `AdminNotificationLog`, `CronLock`.

### Highlighted Constraints & Indexes
- Strict `@@index([tenantId])` and `@@index([tenantId, createdAt])` across almost all operational tables.
- Cascade deletions heavily configured `onDelete: Cascade` tying profiles, subscriptions, and logs to `User` and `Tenant`.
- Unique constraints on Payment References, Paystack Customer Codes, Provider Account IDs.

### Unfinished/Experimental Models
- `ActionRegistry` and `ActionFeedback` appear generalized but slightly disconnected from the highly structured Intelligence domain.
- `PendingSignup` suggests an incomplete or alternative asynchronous gym creation flow.
- `StepUpChallenge` for Step-Up Authentication (noted as Phase 2 in ADR-011) exists in the schema but relies on a disconnected auth flow.

---

## Phase 3: Architecture Recovery

### Authentication Flow
Uses NextAuth with `EmailProvider`. Tokens have a 15-min `maxAge`, Sessions have a 30-day `maxAge` sliding to 24h. Uses JWT strategy but performs DB lookups in the JWT callback to hydrate tenant and role context.

### Billing & Payment Flow
One-Time Charge model mapped to Subscription dates.
1. Frontend requests `/api/payments/initialize`
2. DB creates `PENDING` transaction.
3. Paystack processes payment.
4. `/api/webhooks/paystack` (or similar webhook) receives `charge.success`.
5. HMAC validation is performed.
6. A `$transaction` atomically marks old sub as `REPLACED` and creates new `ACTIVE` subscription.

### Event System
Strict Domain Event System (ADR-002) localized to subscriptions. Handlers are executed sequentially with `try/catch`. Failures do not crash the primary HTTP transaction; they return a `PublishResult`.

### Notification & Email Engine
`EmailJob` table acts as a transactional outbox. Jobs are processed by `/api/workers/email-worker` using Resend. Retries (`nextRetryAt`) and statuses (`FAILED_RENDER`, `PROCESSING`) are tracked.

### Check-in Flow
Members generate a `lastQrNonce` which expires. Scanning hits an endpoint that creates an `Attendance` record with `CheckInMethod.QR` and emits an `AttendanceEvent`.

### Entitlement Resolution
Managed via `MembershipPlan.entitlements` JSON. Access is checked and logged into `EntitlementLog` (Feature, Allowed, Reason) for auditability.

### Architecture Diagrams (Mermaid)

```mermaid
graph TD
    A[Request] --> B(Middleware: Rate Limit & Routing)
    B --> C{Custom Domain?}
    C -->|Yes| D[/api/gym/resolve]
    C -->|No| E[App Router Page/API]
    E --> F[NextAuth JWT Callback]
    F --> G[Prisma ORM]
    G --> H[(PostgreSQL)]
```

---

## Phase 4: Operational Features

### Workers & Webhooks
- **Email Worker**: `/api/workers/email-worker`
  - Trigger: Cron or inline HTTP call.
  - Input: Reads `PENDING` rows from `EmailJob`.
  - Output: Sends email via Resend, updates `EmailLog`.
  - Failure/Retry: `nextRetryAt` backed off.
  - Idempotency: Uses `eventId` uniqueness.
- **Subscriptions Cron**: `/api/cron/subscriptions`
  - Trigger: Vercel Cron `0 1 * * *` (Daily at 1 AM).
  - Input: Scans `Subscription` where `endDate < now()`.
  - Output: Publishes events, updates statuses.
  - Idempotency: Controlled via `CronLock` table to prevent dual-execution.
- **Paystack Webhook**: `/api/webhooks/paystack` & `/api/webhooks/platform-billing`
  - Trigger: External POST from Paystack.
  - Idempotency: `BillingEvent` tracking event hashes, and `Transaction.status` checking.

---

## Phase 5: Security Audit

- **Authentication**: NextAuth Magic Links. Passwords supported but deprecated/secondary.
- **Authorization**: Validated purely in NextAuth `authorized` callback in `middleware.ts`. Protects `/dashboard`, `/admin`.
- **Role System**: Superadmin, Admin, Trainer, Member.
- **Session Policy**: 30 Days, JWT embedded context, documented in ADR-011.
- **Webhook Verification**: HMAC SHA512 signature validation.
- **Rate Limiting**: Upstash Redis applied in Middleware. IP for public endpoints, UserID for authenticated APIs.
- **Audit Logging**: Mandatory tracking via `AuditLog`.
- **Step-Up Authentication**: Model `StepUpChallenge` exists for Phase 2 implementation.
- **Superadmin Bootstrap**: Managed securely via `npx tsx prisma/bootstrap-system.ts`. Never run in CI.

---

## Phase 6: Current Roadmap Recovery

### Status of Features
- **Completed**: Core Billing, NextAuth Passwordless, Multi-tenant middleware routing, Event-Driven subscriptions, Transactional Emails, Basic AI Integration (Gemini 2.0 Flash).
- **Frozen/Completed**: SaaS Billing architecture (moved to one-time simulated subscriptions).
- **In Progress**: 
  - Admin Revenue Tracking (`/api/admin/revenue/route.ts` is open).
  - Community Engagement (`/api/community/posts/[postId]/comments/route.ts` is open).
  - Superadmin Tenant Governance (`/api/superadmin/tenants/route.ts` is open).
  - Gym Member Joining Flow (`/gym/[slug]/join/page.tsx` is open).
- **Blocked**: Step-up authentication (pending full implementation).
- **Experimental**: AI Intelligence Governance, A/B Testing, and Exploration Policies (Phase 7-10).

**Conclusion**: Immediately prior to this audit, the engineer was actively developing **Superadmin Revenue & Tenant Governance features, Community Commenting APIs, and the Frontend Gym Join Flow**.

---

## Phase 7: Technical Debt

1. **Operational Debt (High)**: Heavy reliance on Vercel Serverless Functions for Background Workers. As the system scales, synchronous event bus awaits and basic Vercel Cron may result in timeout errors. Need a dedicated queueing system like Inngest or Upstash QStash.
2. **Code Debt (Medium)**: Complex Sandbox routing logic in Middleware (`/sandbox/`) is hardcoded and fragile.
3. **Architectural Debt (Medium)**: Billing transition to "One-Time Charge" requires rigid date-math and cron jobs to simulate subscriptions, increasing the risk of race conditions on expiration.
4. **Testing Debt (Medium)**: Heavy DB dependency means unit tests require spinning up a DB container or mocking Prisma deeply.
5. **Documentation Debt (Low)**: Excellent ADRs, but some experimental intelligence tables lack behavioral documentation.

---

## Phase 8: Recovery Report & Operating Manual

### Overview
CortexFit is a robust, multi-tenant B2B2C SaaS platform for Gyms. It operates on a Next.js App Router frontend/backend hybrid deployed on Vercel, using PostgreSQL via Prisma, styled with Tailwind CSS, and protected by NextAuth.

### Architectural Rules
1. **Billing Truth**: Dynamic fetch only. `lib/billing/pricingConfig.ts` is the single source of truth. No hardcoded prices.
2. **Event Pub/Sub**: Side-effects in subscriptions must go through `lib/subscriptions/events`. Do NOT write side-effects inline in webhooks.
3. **Subscription State**: Use `isSubscriptionActive` from `lib/subscriptions/memberSubscriptionState.ts`. Do NOT manually check `endDate`.
4. **Middleware Rate Limiting**: All API routes automatically rate-limited by Middleware.
5. **Superadmin**: Scoped entirely outside of tenants (`tenantId = null`). Provisioned via bootstrap script only.

### Deployment Process
- Run `npm run build`.
- Prisma migrations are applied in standard CI/CD.
- Superadmin initialized manually via `npx tsx prisma/bootstrap-system.ts`.
- CRONs configured in `vercel.json`.

### Immediate Next Steps for Incoming Engineer
1. Complete the `admin/revenue` API integration.
2. Finalize the `gym/[slug]/join` page frontend to utilize the `PendingSignup` or `Transaction` initialization flow.
3. Close the loop on Community post comments API.
4. Verify Superadmin Tenant approval logic (`/api/superadmin/tenants/route.ts`).
