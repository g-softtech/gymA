# 🏗️ MULTI-TENANT MIGRATION TRACKER
## Smart Gym SaaS Platform — gymA Project

> **Source of Truth**: This file is populated from live codebase analysis (June 2026).
> Every item reflects actual code, schema, and migration files — not assumptions.
> **Update this file at the end of every session.**

---

## 📊 MIGRATION OVERVIEW

| Status | Count |
|--------|-------|
| ✅ Complete | 6 Phases |
| 🔄 In Progress | 1 Phase (Phase 6 — Public Website) |
| ⏳ Not Started | 3 Phases (Phases 9–11) |

**Architecture Model**: Shared-Database, Row-Level Isolation (tenantId on every table)
**Framework**: Next.js 15 (App Router), PostgreSQL, Prisma ORM, NextAuth (Google OAuth)
**AI Provider**: Anthropic Claude (claude-sonnet-4-20250514)
**Payment**: Paystack integration

---

## 📋 MASTER MIGRATION TABLE

| Phase | Task | Status | Files | Dependencies | Risk |
|-------|------|--------|-------|--------------|------|
| 1 | Prisma schema: Tenant, User, MembershipPlan | ✅ Complete | `schema.prisma`, migration `20260520133251_init_multi_tenant` | - | Low |
| 1 | NextAuth JWT with tenantId + role in token | ✅ Complete | `lib/auth.ts` | Prisma schema | Low |
| 1 | DB re-fetch on every JWT request | ✅ Complete | `lib/auth.ts` | NextAuth | Low |
| 1 | `lib/tenant.ts` resolver + role helpers | ✅ Complete | `lib/tenant.ts` | auth.ts | Low |
| 1 | `SUPERADMIN` role bypass (no tenantId needed) | ✅ Complete | `lib/tenant.ts`, `middleware.ts` | - | Low |
| 2 | `TenantSettings` model (branding, domain, CMS) | ✅ Complete | `schema.prisma`, migration `20260521075021` | Tenant model | Low |
| 2 | `BlogPost` model | ✅ Complete | `schema.prisma` | Tenant model | Low |
| 2 | `Subscription` tenantId backfill (Migration A) | ✅ Complete | migration `20260609162259`, `scripts/backfill-tenant-ids.ts` | Phase 2 schema | Medium |
| 2 | Non-nullable tenantId enforcement (Migration B) | ✅ Complete | migration `20260609163258` | Backfill script | High |
| 2 | WorkoutPlan, MealPlan, FoodLog, ProgressRecord tenantId | ✅ Complete | `schema.prisma` (all `@@index([tenantId,...])`) | Migration B | Medium |
| 2 | `/api/tenant/settings` PATCH (admin updates) | ✅ Complete | `app/api/tenant/settings/route.ts` | TenantSettings model | Low |
| 2 | `/api/tenant/settings?slug=` public GET | ✅ Complete | `app/api/tenant/settings/route.ts` | - | Low |
| 2 | `/api/tenant/create` endpoint | ✅ Complete | `app/api/tenant/create/` | Tenant model | Low |
| 3 | `middleware.ts` subdomain routing | ✅ Complete | `middleware.ts` | ROOT_DOMAIN env | Medium |
| 3 | `middleware.ts` custom domain routing → `/api/gym/resolve` | ✅ Complete | `middleware.ts`, `app/api/gym/resolve/` | TenantSettings.customDomain | Medium |
| 3 | SuperAdmin route guard in middleware | ✅ Complete | `middleware.ts` | SUPERADMIN role | Low |
| 3 | `/gym/[slug]/join` explicit confirmation page | ✅ Complete | `app/gym/[slug]/join/page.tsx` | Tenant slug lookup | Low |
| 3 | `/api/gym/[slug]/join` POST endpoint | ✅ Complete | `app/api/gym/[slug]/join/route.ts` | Tenant model | Low |
| 3 | `/gym/[slug]/dashboard` layout with tenant isolation check | ✅ Complete | `app/gym/[slug]/dashboard/layout.tsx` | Auth session | Medium |
| 3 | Legacy `/dashboard` redirect to `/gym/[slug]/dashboard` | ✅ Complete | `app/(dashboard)/dashboard/layout.tsx` | - | Low |
| 3 | `/gym/[slug]/dashboard/admin` page | ✅ Complete | `app/gym/[slug]/dashboard/admin/page.tsx` | Admin role check | Low |
| 3 | `/gym/[slug]/dashboard/member` page | ✅ Complete | `app/gym/[slug]/dashboard/member/page.tsx` | Member role check | Low |
| 3 | `/gym/[slug]/dashboard/trainer` page | ✅ Complete | `app/gym/[slug]/dashboard/trainer/page.tsx` | Trainer role check | Low |
| 4 | Attendance tracking + notifications | ✅ Complete | migration `20260527210901`, API routes | Phase 3 | Low |
| 4 | Booking system (trainer calendar) | ✅ Complete | migration `20260529030404`, `app/api/bookings/` | TrainerProfile | Medium |
| 4 | Progress records + Messages | ✅ Complete | migration `20260604005800`, `app/api/trainer/progress/`, `app/api/messages/` | - | Low |
| 4 | AI Workout Coach (`/api/ai/workout`) | ✅ Complete | `app/api/ai/workout/route.ts` | Anthropic API key | Medium |
| 4 | AI Nutrition Coach (`/api/ai/nutrition`) | ✅ Complete | `app/api/ai/nutrition/route.ts` | Anthropic API key | Medium |
| 4 | AI Progress Analyzer (`/api/ai/progress`) | ✅ Complete | `app/api/ai/progress/route.ts` | ProgressRecord data | Medium |
| 4 | AI Chat Assistant (`/api/ai/chat`) | ✅ Complete | `app/api/ai/chat/route.ts` | Anthropic API key | Low |
| 4 | Payment verify (Paystack) | ✅ Complete | `app/api/payments/verify/route.ts` | PAYSTACK_SECRET_KEY | High |
| 4 | Onboarding flow `/onboarding` | ✅ Complete | `app/(onboarding)/onboarding/` | Tenant creation | Low |
| 4 | Member nutrition CRUD | ✅ Complete | `app/api/member/nutrition/meal-plans/`, `food-log/` | Tenant isolation | Low |
| 5 | `TenantSettings` branding in dashboard layout | ✅ Complete | `app/gym/[slug]/dashboard/layout.tsx` | TenantSettings model | Low |
| 5 | Brand CSS variables injected (primaryColor, fontFamily) | ✅ Complete | `app/gym/[slug]/dashboard/layout.tsx` | TenantSettings | Low |
| 5 | `TenantThemeProvider` component | ✅ Complete | `components/TenantThemeProvider.tsx` | TenantSettings | Low |
| 5 | Google Fonts dynamic injection | ✅ Complete | dashboard layout | fontFamily field | Low |
| 5 | Admin Website CMS editor | ✅ Complete | `app/gym/[slug]/dashboard/admin/website/` (hero, branding, content, social, info) | TenantSettings | Medium |
| 5 | Admin Notification center | ✅ Complete | `app/gym/[slug]/dashboard/admin/notifications/` | Notification model | Low |
| 5 | Admin Revenue page | ✅ Complete | `app/gym/[slug]/dashboard/admin/revenue/` | Subscription model | Low |
| 5 | Admin Members page | ✅ Complete | `app/gym/[slug]/dashboard/admin/members/` | MemberProfile | Low |
| 5 | Admin Trainers page | ✅ Complete | `app/gym/[slug]/dashboard/admin/trainers/` | TrainerProfile | Low |
| 5 | Admin Plans page | ✅ Complete | `app/gym/[slug]/dashboard/admin/plans/` | MembershipPlan | Low |
| 5 | Admin Attendance page | ✅ Complete | `app/gym/[slug]/dashboard/admin/attendance/` | Attendance model | Low |
| 5 | Admin Blog manager | ✅ Complete | `app/gym/[slug]/dashboard/admin/blog/` | BlogPost model | Low |
| 5 | Member profile, workouts, nutrition, community, AI coach, bookings, progress, attendance, messages, notifications | ✅ Complete | `app/gym/[slug]/dashboard/member/[...]` | All member models | Low |
| 5 | Trainer schedule, clients, workouts, bookings, progress, messages | ✅ Complete | `app/gym/[slug]/dashboard/trainer/[...]` | Trainer models | Low |
| 5 | SuperAdmin dashboard (`/admin`) | ✅ Complete | `app/(superadmin)/admin/page.tsx`, `layout.tsx` | SUPERADMIN role | Low |
| 5 | SuperAdmin tenants list | ✅ Complete | `app/(superadmin)/admin/tenants/page.tsx` | Tenant model | Low |
| 5 | SuperAdmin all-users view | ✅ Complete | `app/(superadmin)/admin/users/` | User model | Low |
| 5 | `/api/superadmin/users` filtered query | ✅ Complete | `app/api/superadmin/users/route.ts` | SUPERADMIN role | Low |
| 5 | Community system (Posts, Likes, Comments, Badges, Challenges) | ✅ Complete | migrations `20260607061521`, `app/api/community/` | Tenant isolation | Low |
| 6 | Nutrition DB migration | ✅ Complete | migration `20260606145817_phase7_nutrition` | - | Low |
| 6 | Public gym landing page `/gym/[slug]` | ✅ Complete | `app/gym/[slug]/page.tsx` (864 lines, full CMS rendering) | TenantSettings | Low |
| 6 | Dynamic SEO metadata (generateMetadata) | ✅ Complete | `app/gym/[slug]/page.tsx` | metaTitle, ogImageUrl | Low |
| 6 | Trainer public profiles (`showOnWebsite`) | ✅ Complete | `app/gym/[slug]/page.tsx`, TrainerProfile schema | TrainerProfile | Low |
| 6 | Membership plans public display + Paystack checkout | ✅ Complete | `app/gym/[slug]/page.tsx`, `app/gym/[slug]/checkout/` | MembershipPlan | Medium |
| 6 | Blog public pages (`/gym/[slug]/blog`) | ✅ Complete | `app/gym/[slug]/blog/` | BlogPost model | Low |
| 6 | Platform-level marketing landing page | ✅ Complete | `app/(marketing)/page.tsx` (9665 bytes) | - | Low |
| 6 | Platform about, pricing, blog, contact pages | ✅ Complete | `app/(marketing)/about/`, `pricing/`, `blog/`, `contact/` | - | Low |
| 6 | `CheckoutButton.tsx` (Paystack inline) | ✅ Complete | `components/CheckoutButton.tsx` | PAYSTACK_PUBLIC_KEY | Medium |
| 7 | Paystack webhook (HMAC-SHA512 verified, idempotent) | ✅ Complete | `app/api/payments/webhook/route.ts` | PAYSTACK_SECRET_KEY | High |
| 7 | Subscription expiry cron + 3-day warning | ✅ Complete | `app/api/cron/subscriptions/route.ts`, `vercel.json` | CRON_SECRET | High |
| 7 | Subscription lifecycle (cancel, activate, view) | ✅ Complete | `app/api/member/subscription/route.ts` | Subscription model | High |
| 7 | CheckoutButton metadata (userId + planId for webhook) | ✅ Complete | `components/CheckoutButton.tsx` | - | Medium |
| 7 | Contact form API + ContactForm component | ✅ Complete | `app/api/contact/route.ts`, `components/ContactForm.tsx` | - | Medium |
| 7 | ContactForm wired to public gym page | ✅ Complete | `app/gym/[slug]/page.tsx` | ContactForm | Low |
| 7 | Middleware allowlist updated (webhook + cron) | ✅ Complete | `middleware.ts` | - | Low |
| 8 | `lib/ratelimit.ts` — Upstash Redis rate limiter (graceful no-op if no Redis) | ✅ Complete | `lib/ratelimit.ts` | UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN | High |
| 8 | Rate limiting on all 4 AI routes (20 calls/hour/user) | ✅ Complete | `app/api/ai/chat`, `workout`, `nutrition`, `progress` | lib/ratelimit.ts | High |
| 8 | `ai_logs` Prisma model + migration | ✅ Complete | `schema.prisma`, migration `20260610200507` | - | Medium |
| 8 | Fire-and-forget AI usage logging in all 4 AI routes | ✅ Complete | All `/api/ai/*` routes | AiLog model | Medium |
| 8 | `/api/admin/ai-usage` — usage analytics with cost estimate | ✅ Complete | `app/api/admin/ai-usage/route.ts` | AiLog model | Medium |
| 8 | Admin AI Usage Analytics dashboard page | ✅ Complete | `app/gym/[slug]/dashboard/admin/ai-usage/page.tsx` | /api/admin/ai-usage | Low |
| 8 | Admin AI Usage + Blog nav links added to admin sidebar | ✅ Complete | `dashboard/layout.tsx` | - | Low |
| 8 | **AI Provider Migration: Anthropic → Google Gemini** | ✅ Complete | `lib/gemini.ts` (new service layer) | GOOGLE_API_KEY | Low |
| 8 | Gemini service layer (`lib/gemini.ts`) — generateText, generateJSON, generateChatReply | ✅ Complete | `lib/gemini.ts` | @google/generative-ai | Low |
| 8 | All 4 AI routes migrated to Gemini (chat, workout, nutrition, progress) | ✅ Complete | `/api/ai/*` | lib/gemini.ts | Low |
| 8 | Cost formula updated to Gemini 2.0 Flash pricing in admin analytics | ✅ Complete | `/api/admin/ai-usage/route.ts` | - | Low |
| 8 | Marketing FAQ updated (Claude → Gemini) | ✅ Complete | `app/(marketing)/pricing/page.tsx` | - | Low |
| 8 | AiLog.model default updated to `gemini-2.0-flash` | ✅ Complete | schema.prisma, migration SQL pending DB | - | Low |
| 9 | Custom domain verification flow | ⏳ Not Started | `app/api/gym/resolve/route.ts` needs DB | TenantSettings.customDomain | High |
| 9 | Flutterwave integration | ⏳ Not Started | Parallel to Paystack | Payment system | Medium |
| 9 | AI Booking Optimizer | ⏳ Not Started | New AI endpoint | Booking model | Medium |
| 9 | AI Community Engine (challenge suggestions) | ⏳ Not Started | New AI endpoint | Community models | Low |
| 10 | SaaS billing (plan gating: FREE/STARTER/PRO) | ⏳ Not Started | `TenantPlan` enum exists in schema | Subscription system | High |
| 10 | Platform-level Stripe subscription | ⏳ Not Started | Separate from gym-level Paystack | SaaS billing | High |
| 10 | Feature flags per plan | ⏳ Not Started | Could be middleware/API layer | TenantPlan | Medium |

---

## 📁 PHASE-BY-PHASE DETAIL

---

### PHASE 1 — CORE MULTI-TENANT FOUNDATION
**Status: ✅ COMPLETE**

#### Completed Tasks
- [x] Prisma schema with `Tenant`, `User` (with `tenantId?`), `MembershipPlan` (with `tenantId`)
- [x] `Role` enum: SUPERADMIN, ADMIN, TRAINER, MEMBER
- [x] `TenantPlan` enum: FREE, STARTER, PROFESSIONAL, ENTERPRISE (schema-ready)
- [x] NextAuth v4 with Google OAuth provider
- [x] JWT callbacks that embed `id`, `role`, `tenantId` in session token
- [x] Re-fetch from DB on every JWT refresh (ensures role changes take effect immediately)
- [x] `lib/tenant.ts` — `getTenantContext()`, `getTenantContextFromSession()`, `requireRole()`, `requireAdmin()`, `requireSuperAdmin()`, `assertTenantOwner()`
- [x] SUPERADMIN bypass (no tenantId required)
- [x] `next-auth.d.ts` type augmentation for session.user

#### Remaining Tasks
- None

#### Dependencies
- PostgreSQL database with `DATABASE_URL` env var
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

#### Risks
- Low — this phase is the most stable part of the system

#### Validation Checklist
- [x] User can sign in with Google
- [x] `session.user.role` and `session.user.tenantId` are populated
- [x] SUPERADMIN can access `/admin` without a tenantId

---

### PHASE 2 — TENANT ISOLATION (FULL ROW-LEVEL)
**Status: ✅ COMPLETE**

#### Completed Tasks
- [x] `TenantSettings` model (branding, domain, CMS JSON blobs, SEO fields)
- [x] `BlogPost` model with tenant scoping
- [x] Added `tenantId` as nullable to: Subscription, WorkoutPlan, MealPlan, FoodLog, ProgressRecord (Migration A)
- [x] Backfill script (`prisma/scripts/backfill-tenant-ids.ts`) — walks member→user→tenant chain
- [x] `.mjs` version of backfill script for Node.js compatibility
- [x] Migration B — made all 5 tenantId columns non-nullable
- [x] Composite indexes: `@@index([tenantId, status])`, `@@index([tenantId, createdAt])`, etc.
- [x] `/api/tenant/settings` GET (public + authenticated modes)
- [x] `/api/tenant/settings` PATCH (admin upsert)
- [x] `/api/tenant/create` endpoint

#### Remaining Tasks
- None

#### Dependencies
- Migration A must run before backfill script
- Backfill script must confirm zero nulls before Migration B

#### Risks
- High — retroactive schema changes. COMPLETED successfully.

#### Validation Checklist
- [x] All tenantId columns are non-nullable in schema.prisma
- [x] All queries use `where: { tenantId: ctx.tenantId }` — verified in community posts, meal plans, food logs, workout plans
- [x] TenantSettings can be created/updated via API
- [x] SUPERADMIN can bypass tenant filtering

---

### PHASE 3 — ROUTING & ONBOARDING
**Status: ✅ COMPLETE**

#### Completed Tasks
- [x] `middleware.ts` subdomain routing: `gym.smartgym.com` → `/gym/gym/...`
- [x] `middleware.ts` custom domain routing → `/api/gym/resolve?domain=...`
- [x] Reserved subdomain list: www, app, api, admin, mail, smtp
- [x] SuperAdmin route guard in middleware (`/admin` → SUPERADMIN only)
- [x] Public route whitelist in middleware (auth, blog, contact, gym public pages)
- [x] `/gym/[slug]/join` page — explicit consent before tenant assignment
- [x] `/api/gym/[slug]/join` POST — assigns user to tenant, then forces session refresh
- [x] No silent auto-assign (removed from earlier implementation)
- [x] `/gym/[slug]/dashboard/layout.tsx` — tenant mismatch check (shows "Access Denied" if wrong tenant)
- [x] Legacy `/dashboard` layout redirects to `/gym/[slug]/dashboard/[role]`
- [x] `(onboarding)/onboarding/` flow for new gym owners
- [x] `/api/gym/[slug]` GET endpoint (public gym data lookup)
- [x] `/api/gym/resolve` endpoint (custom domain resolver)

#### Remaining Tasks
- None

#### Dependencies
- `NEXT_PUBLIC_ROOT_DOMAIN` env var must be set

#### Risks
- Medium — subdomain routing requires correct DNS configuration in production

#### Validation Checklist
- [x] `gym.smartgym.com` correctly rewrites to `/gym/gym/...`
- [x] Users without a tenant are redirected to join page
- [x] Users from different tenants see "Access Denied"
- [x] `/admin` redirects non-SUPERADMIN users

---

### PHASE 4 — CORE FEATURE MODULES
**Status: ✅ COMPLETE**

#### Completed Tasks
- [x] Attendance: `Attendance` model, tracking API, admin view
- [x] Notifications: `Notification` model, notification API, admin + member views
- [x] Bookings: `Booking` model, booking creation API, conflict detection, status management
- [x] Progress Records: `ProgressRecord` model, trainer can create, member can view
- [x] Messages: `Message` model, send/receive API, trainer and member views
- [x] AI Workout Coach: `/api/ai/workout` → Anthropic API → saves WorkoutPlan to DB
- [x] AI Nutrition Coach: `/api/ai/nutrition` → TDEE calculation + Nigerian food adaptation
- [x] AI Progress Analyzer: `/api/ai/progress` → structured analysis with recommendations
- [x] AI Chat Assistant: `/api/ai/chat` → general conversational coach
- [x] Payment verification: `/api/payments/verify` (Paystack inline verify + subscription create)
- [x] Checkout page: `/gym/[slug]/checkout/[planId]`
- [x] `CheckoutButton.tsx` component (Paystack popup integration)
- [x] Onboarding: `/onboarding` creates tenant + assigns admin role
- [x] Member Nutrition CRUD: `/api/member/nutrition/meal-plans/`, `/api/member/nutrition/food-log/`
- [x] Member Bookings API: `/api/bookings/` (create + list) + `/api/bookings/[bookingId]/`
- [x] Trainer APIs: schedule, clients, workouts, progress, messages

#### Remaining Tasks
- [ ] Paystack **webhook** endpoint (currently only inline verify — no background webhook handler)
- [ ] Subscription lifecycle API (cancel, renew)
- [ ] Subscription auto-expiry (no cron job yet)

#### Dependencies
- `ANTHROPIC_API_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` env vars

#### Risks
- **HIGH**: No webhook handler means payment confirmations depend solely on client-side inline verify. A failed callback = lost subscription activation.

#### Validation Checklist
- [x] AI endpoints respond with valid JSON
- [x] tenantId always sourced from session (never from request body)
- [x] Bookings respect trainer availability
- [ ] ⚠️ Webhook handler missing
- [ ] ⚠️ Subscription expiry not automated

---

### PHASE 5 — DASHBOARDS & SUPERADMIN
**Status: ✅ COMPLETE**

#### Completed Tasks
- [x] Dashboard layout applies `TenantSettings` brand colors, fonts, logo
- [x] CSS custom properties `--brand-primary`, `--brand-secondary`, `--brand-accent` injected
- [x] Google Fonts dynamic injection based on `TenantSettings.fontFamily`
- [x] `TenantThemeProvider` component
- [x] **Admin Dashboard**: overview stats, members, trainers, plans, attendance, revenue, notifications, website CMS, blog
- [x] **Admin Website CMS**: `/admin/website/` with sub-editors for hero, branding, content, social, info
- [x] **Member Dashboard**: profile, workouts, nutrition, community, AI coach, bookings, progress, attendance, notifications, messages
- [x] **Trainer Dashboard**: overview, clients, workout plans, schedule, bookings, progress tracking, messages
- [x] **SuperAdmin Panel** (`/admin`): overview, tenants list, all-users view with filters
- [x] `/api/superadmin/users` — cross-tenant user query with tenantId/role/search filters
- [x] `/api/superadmin/tenants` — tenant management
- [x] Community system: posts (text+image), likes, comments, badges, challenges
- [x] Badge system (FIRST_CHECKIN, STREAK_7, STREAK_30, COMMUNITY_STAR, etc.)

#### Remaining Tasks
- None

#### Dependencies
- TenantSettings must be configured for branding to render

#### Risks
- Low — UI is complete; data flows through properly scoped tenant context

#### Validation Checklist
- [x] Dashboard sidebar reflects correct gym branding
- [x] Admin can update branding via Website CMS
- [x] Community posts are tenant-scoped
- [x] SuperAdmin can view all tenants

---

### PHASE 6 — PUBLIC GYM WEBSITE (PER-TENANT)
**Status: 🔄 IN PROGRESS / MOSTLY COMPLETE**

#### Completed Tasks
- [x] `/gym/[slug]` — full public landing page (864 lines, CMS-driven)
  - [x] Hero section (bg image support, animated blobs fallback)
  - [x] Stats bar
  - [x] About section
  - [x] Features grid
  - [x] Services grid (with images)
  - [x] Trainers showcase (showOnWebsite flag)
  - [x] Membership plans with Paystack checkout links
  - [x] Testimonials
  - [x] Photo gallery (masonry layout)
  - [x] Blog posts preview (3 latest published)
  - [x] Contact + social links
  - [x] Opening hours display
  - [x] Map embed (iframe)
  - [x] Dynamic SEO metadata (`generateMetadata`)
  - [x] OG image, favicon from TenantSettings
- [x] `/gym/[slug]/blog` — public blog listing
- [x] `/gym/[slug]/blog/[postId]` — individual blog post
- [x] `TenantThemeProvider` wraps the public page
- [x] Platform-level marketing site (`(marketing)/page.tsx`, about, pricing, blog, contact)
- [x] `TrainerProfile.showOnWebsite` + `publicPhotoUrl` + `bio` + `hourlyRate` fields

#### Remaining Tasks
- [ ] `/gym/[slug]/onboarding` — tenant-specific onboarding wizard (directory exists but needs page content)
- [ ] Platform marketing blog CMS (currently static)
- [ ] Platform pricing page linked to SaaS subscription (currently placeholder)
- [ ] Contact form submission endpoint (`/api/contact` referenced in middleware allowlist but needs implementation)
- [ ] Gallery: no image upload system yet (admin must enter URLs manually)

#### Dependencies
- TenantSettings must be populated with CMS data for full page to render
- `PAYSTACK_PUBLIC_KEY` for checkout buttons

#### Risks
- Medium — if TenantSettings is empty, the public page renders minimal content (only gym name and a join button)

#### Validation Checklist
- [x] `/gym/[slug]` renders without TenantSettings (graceful defaults)
- [x] Plans section links to checkout
- [x] Blog posts only show `published: true` entries
- [ ] ⚠️ Contact form not functional
- [ ] ⚠️ Image upload for gallery/logo not implemented

---

### PHASE 7 — WEBHOOKS & SUBSCRIPTION LIFECYCLE
**Status: ✅ COMPLETE**

#### Completed Tasks
- [x] `POST /api/payments/webhook` — HMAC-SHA512 signature verification, idempotency check, subscription creation, welcome notification
- [x] `CheckoutButton.tsx` — now passes `user_id` + `plan_id` as Paystack metadata custom fields for reliable server-side resolution
- [x] `GET /api/member/subscription` — member can fetch active subscription + last expired plan
- [x] `PATCH /api/member/subscription` — admin can cancel or manually activate a subscription (with member notification)
- [x] `GET /api/cron/subscriptions` — daily subscription expiry + 3-day warning notifications
- [x] `vercel.json` — Vercel Cron configured to run daily at 01:00 UTC
- [x] `POST /api/contact` — contact form backend (validates, resolves tenant, creates admin notification)
- [x] `components/ContactForm.tsx` — client-side form with success/error states, brand-colored
- [x] Contact form wired into `/gym/[slug]/page.tsx`
- [x] Middleware allowlist updated for webhook + cron routes

#### Remaining Tasks
- [ ] Email delivery integration (Resend/Nodemailer) for: activation email, expiry warning email, contact form email to gym owner

#### Dependencies
- `PAYSTACK_SECRET_KEY`, `CRON_SECRET` env vars
- Vercel deployment for cron to trigger (cron does not run in local dev)

#### Risks
- Low — core logic complete. Email delivery is optional enhancement.

---

### PHASE 8 — PRODUCTION HARDENING
**Status: ⏳ NOT STARTED**

#### Remaining Tasks
- [ ] Rate limiting on AI routes (Upstash Redis or custom token bucket)
- [ ] Rate limiting on auth routes
- [ ] `ai_logs` table — log every AI call with tenantId, userId, model, tokens, cost estimate
- [ ] Input sanitization audit on all POST endpoints
- [ ] Error monitoring integration (Sentry)
- [ ] Environment variable validation at startup
- [ ] API response caching for public gym data (Redis or Next.js cache)
- [ ] Image optimization / CDN for logo/gallery uploads

#### Dependencies
- Redis setup (Upstash recommended for Vercel Edge)
- Sentry DSN

#### Risks
- High — no rate limiting means AI endpoints are exploitable

---

### PHASE 9 — ADVANCED FEATURES
**Status: ⏳ NOT STARTED**

#### Remaining Tasks
- [ ] Custom domain verification flow (DNS TXT record check)
- [ ] Flutterwave integration (parallel to Paystack)
- [ ] AI Booking Optimizer (trainer matching + slot suggestion)
- [ ] AI Community Engine (challenge generation, post recommendations)
- [ ] Leaderboard for challenges
- [ ] Progress photo upload
- [ ] Multi-branch support (multiple locations per tenant)

#### Dependencies
- Phase 7 subscription lifecycle
- Phase 8 hardening complete

---

### PHASE 10 — SAAS PLATFORM BILLING
**Status: ⏳ NOT STARTED**

The `TenantPlan` enum (FREE, STARTER, PROFESSIONAL, ENTERPRISE) exists in the schema but no feature gating is implemented.

#### Remaining Tasks
- [ ] Stripe integration for SaaS platform subscriptions (not gym-level; this is gym-owner paying SmartGym)
- [ ] Feature flags middleware: check `tenant.plan` before allowing AI features, advanced analytics, custom domain
- [ ] Plan upgrade/downgrade flow at platform level
- [ ] Usage-based limits per plan (e.g., max members, max AI calls)
- [ ] Admin billing dashboard on SuperAdmin panel

#### Dependencies
- `TenantPlan` enum (already in schema)
- Stripe setup

---

## 🗃️ DATABASE SCHEMA STATUS

| Model | tenantId | Isolation | Indexes | Status |
|-------|----------|-----------|---------|--------|
| Tenant | IS the root | N/A | unique(slug) | ✅ |
| TenantSettings | tenantId unique | Full | tenantId unique | ✅ |
| User | tenantId? nullable | Scoped | - | ✅ |
| MemberProfile | via User | Via User.tenantId | - | ✅ |
| TrainerProfile | via User | Via User.tenantId | - | ✅ |
| MembershipPlan | tenantId | Full | - | ✅ |
| Subscription | tenantId (non-null) | Full | [tenantId, status] | ✅ |
| WorkoutPlan | tenantId (non-null) | Full | [tenantId, createdAt] | ✅ |
| Booking | tenantId | Full | [tenantId, status], [trainerId, date], [memberId] | ✅ |
| Attendance | tenantId | Full | [tenantId, checkedInAt], [memberId] | ✅ |
| ProgressRecord | tenantId (non-null) | Full | [memberId, recordedAt], [tenantId, recordedAt] | ✅ |
| MealPlan | tenantId (non-null) | Full | [memberId], [tenantId, createdAt] | ✅ |
| FoodLog | tenantId (non-null) | Full | [memberId, date], [tenantId, date] | ✅ |
| Post | tenantId | Full | [tenantId, createdAt] | ✅ |
| Challenge | tenantId | Full | [tenantId] | ✅ |
| Message | tenantId | Full | [tenantId], [senderId, receiverId] | ✅ |
| Notification | tenantId | Full | [tenantId, read], [userId] | ✅ |
| BlogPost | tenantId | Full | [tenantId, published, publishedAt] | ✅ |
| ai_logs | ❌ Not created | N/A | N/A | ⏳ Not Started |

---

## 🗂️ MIGRATIONS HISTORY

| Migration | Date | Description |
|-----------|------|-------------|
| `20260520133251_init_multi_tenant` | May 20 | Initial schema: Tenant, User, Auth tables |
| `20260521075021_phase2_memberships` | May 21 | MembershipPlan + Subscription |
| `20260521134555_phase2_init` | May 21 | Extended Phase 2 models |
| `20260527210901_phase3_attendance_notifications` | May 27 | Attendance + Notification models |
| `20260529030404_phase4_bookings_trainer` | May 29 | Booking + TrainerProfile enhancements |
| `20260604005800_phase4b_progress_messages` | Jun 04 | ProgressRecord + Message |
| `20260606145817_phase7_nutrition` | Jun 06 | MealPlan + FoodLog models |
| `20260607061521_phase8_community` | Jun 07 | Post, PostLike, Comment, Challenge, ChallengeEntry, Badge |
| `20260609162259_phase2_migration_a_tenant_isolation` | Jun 09 | Added nullable tenantId to 5 tables |
| `20260609163258_phase2_migration_b_non_nullable_tenant_ids` | Jun 09 | Made tenantId non-nullable (after backfill) |

---

## ⚠️ KNOWN ISSUES & RISKS

| # | Issue | Severity | Phase | Notes |
|---|-------|----------|-------|-------|
| 1 | No Paystack webhook handler | 🔴 CRITICAL | 7 | Payments rely on client-side verify only |
| 2 | No subscription expiry cron | 🔴 HIGH | 7 | Expired subscriptions stay ACTIVE indefinitely |
| 3 | No rate limiting on AI endpoints | 🔴 HIGH | 8 | Any authenticated user can spam AI calls |
| 4 | No `ai_logs` table | 🟡 MEDIUM | 8 | AI usage is untracked — no cost visibility |
| 5 | Contact form API not implemented | 🟡 MEDIUM | 6 | `/api/contact` in middleware allowlist but no route file |
| 6 | No image upload system | 🟡 MEDIUM | 6 | Admin must manually enter image URLs |
| 7 | `TenantPlan` feature gating absent | 🟡 MEDIUM | 10 | All features available on FREE plan |
| 8 | Custom domain resolution is DB-async | 🟡 MEDIUM | 9 | Edge middleware can't do DB; relies on `/api/gym/resolve` |
| 9 | Google OAuth only | 🟢 LOW | 1 | No email/password login |
| 10 | Platform marketing pages are static | 🟢 LOW | 6 | No CMS for platform-level content |

---

*Last Updated: June 11, 2026 — Session 4: AI provider fully migrated from Anthropic Claude → Google Gemini 2.0 Flash*
*Next Update Due: End of next development session*
