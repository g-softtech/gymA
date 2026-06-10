# 🤖 AI HANDOFF DOCUMENT
## Smart Gym SaaS Platform — gymA

> **PURPOSE**: This file allows any new AI session to immediately resume development
> without re-analyzing the codebase. Read this FIRST before touching any code.
> **RULE**: Update this file before ending every session.

---

## 📍 CURRENT STATE (June 10, 2026)

### Current Phase: Phase 9 — Advanced Features

### Current Status
**Phase 8 is fully complete.** All AI endpoints are rate-limited, AI usage is logged, and admins have a live analytics dashboard with cost estimates. The platform is now protected against runaway API costs.

### Where Development Stopped
Phase 8 was completed in Session 3 (June 10, 2026). The next task is **Phase 9: Advanced Features** — starting with the custom domain verification flow.

---

## ✅ WHAT IS COMPLETE (DO NOT REDO)

### Architecture
- **Multi-tenancy**: Shared-Database, Row-Level Isolation via `tenantId` on every table
- **Auth**: NextAuth v4, Google OAuth, JWT with role+tenantId embedded and re-fetched from DB on every request
- **Routing**: Subdomain routing (`gym.smartgym.com` → `/gym/gym/...`), custom domain routing via `/api/gym/resolve`, path-based routing (`/gym/[slug]`)
- **Tenant Library**: `lib/tenant.ts` — complete set of helpers: `getTenantContext()`, `getTenantContextFromSession()`, `requireRole()`, `requireAdmin()`, `requireTrainer()`, `requireSuperAdmin()`, `assertTenantOwner()`, `unauthorized()`, `forbidden()`, `noTenantContext()`

### Database Schema (all migrations run)
- `Tenant`, `TenantSettings`, `User`, `Account`, `Session`, `VerificationToken`
- `MemberProfile`, `TrainerProfile`
- `MembershipPlan`, `Subscription` (tenantId non-null)
- `WorkoutPlan`, `Booking`, `Attendance`, `ProgressRecord` (tenantId non-null)
- `MealPlan`, `FoodLog` (tenantId non-null)
- `Post`, `PostLike`, `Comment`, `Challenge`, `ChallengeEntry`, `Badge`
- `Message`, `Notification`
- `BlogPost`
- Enums: `Role`, `SubscriptionStatus`, `NotificationType`, `BookingStatus`, `SessionType`, `DietGoal`, `BadgeType`, `ChallengeType`, `TenantPlan`

### API Routes (all built and tenant-isolated)
```
... (same as before — all Phase 4–6 routes)

# PHASE 7 ADDITIONS (Session 2):
/api/payments/webhook            — POST: Paystack HMAC webhook (public, no auth)
/api/member/subscription         — GET (member's sub status) + PATCH (admin cancel/activate)
/api/cron/subscriptions          — GET: daily expiry cron (protected by CRON_SECRET)
/api/contact                     — POST: public contact form (no auth)
```
```
/api/auth/[...nextauth]         — NextAuth
/api/gym/[slug]                 — Public gym data
/api/gym/[slug]/join            — POST: assign user to tenant
/api/gym/resolve                — Custom domain resolution
/api/tenant/settings            — GET (public+auth) + PATCH (admin)
/api/tenant/create              — POST: create new gym tenant
/api/bookings                   — GET + POST (member creates booking)
/api/bookings/[bookingId]       — GET + PATCH (status updates)
/api/admin/users                — GET (admin: list tenant users)
/api/admin/trainers             — GET + POST
/api/admin/plans-list           — GET: membership plans
/api/admin/revenue              — GET: revenue stats
/api/admin/promote              — POST: promote user to trainer
/api/attendance                 — POST (check-in) + GET
/api/notifications              — GET + PATCH (mark read)
/api/member/profile             — GET + PATCH
/api/member/bookings            — GET (member's own bookings)
/api/member/nutrition/meal-plans — GET + POST + DELETE
/api/member/nutrition/food-log  — GET + POST + DELETE
/api/trainer/schedule           — GET + PATCH (availability)
/api/trainer/clients            — GET (trainer's assigned members)
/api/trainer/workouts           — GET + POST (trainer creates plans)
/api/trainer/progress           — GET + POST (record member measurements)
/api/trainer/messages           — GET + POST
/api/trainer/bookings           — GET (trainer's bookings)
/api/community/posts            — GET + POST + DELETE
/api/community/posts/[postId]   — GET; includes likes/comments
/api/community/challenges       — GET + POST
/api/messages                   — GET + POST
/api/plans                      — GET (public membership plans per tenant)
/api/payments/verify            — POST: Paystack inline verify + create Subscription
/api/ai/workout                 — POST: generate workout plan (Anthropic)
/api/ai/nutrition               — POST: generate meal plan (Anthropic, Nigerian foods)
/api/ai/progress                — POST: analyze progress records (Anthropic)
/api/ai/chat                    — POST: conversational AI coach (Anthropic)
/api/blog                       — GET + POST (tenant blog posts)
/api/blog/[postId]              — GET + PATCH + DELETE
/api/superadmin/users           — GET (cross-tenant, SUPERADMIN only)
/api/superadmin/tenants         — GET + PATCH (SUPERADMIN only)
```

### Pages (all built)
```
/(marketing)/page.tsx           — Platform landing page
/(marketing)/about              — Platform about page
/(marketing)/pricing            — Platform pricing page (static)
/(marketing)/blog               — Platform blog
/(marketing)/contact            — Platform contact page

/(auth)/...                     — NextAuth sign-in
/(onboarding)/onboarding        — New gym owner onboarding wizard

/gym/[slug]                     — Public gym landing page (CMS-driven, 864 lines)
/gym/[slug]/join                — Membership join confirmation
/gym/[slug]/checkout/[planId]   — Paystack checkout
/gym/[slug]/blog                — Public blog listing
/gym/[slug]/blog/[postId]       — Public blog post

/gym/[slug]/dashboard/          — Dashboard shell (layout.tsx with branding)
/gym/[slug]/dashboard/admin                  — Admin overview
/gym/[slug]/dashboard/admin/members          — Member management
/gym/[slug]/dashboard/admin/trainers         — Trainer management
/gym/[slug]/dashboard/admin/plans            — Membership plan management
/gym/[slug]/dashboard/admin/attendance       — Attendance records
/gym/[slug]/dashboard/admin/revenue          — Revenue analytics
/gym/[slug]/dashboard/admin/notifications    — Notification center
/gym/[slug]/dashboard/admin/blog             — Blog post manager
/gym/[slug]/dashboard/admin/website          — Website CMS (hero, branding, content, social, info)

/gym/[slug]/dashboard/member                 — Member overview
/gym/[slug]/dashboard/member/profile         — Member profile editor
/gym/[slug]/dashboard/member/workouts        — Workout plans
/gym/[slug]/dashboard/member/nutrition       — Nutrition + food log
/gym/[slug]/dashboard/member/community       — Social feed
/gym/[slug]/dashboard/member/ai              — AI Coach chat
/gym/[slug]/dashboard/member/bookings        — Book a trainer
/gym/[slug]/dashboard/member/progress        — Progress tracking
/gym/[slug]/dashboard/member/attendance      — Attendance history
/gym/[slug]/dashboard/member/notifications   — Notifications
/gym/[slug]/dashboard/member/messages        — Messages

/gym/[slug]/dashboard/trainer                — Trainer overview
/gym/[slug]/dashboard/trainer/clients        — Client list
/gym/[slug]/dashboard/trainer/workouts       — Workout plan builder
/gym/[slug]/dashboard/trainer/schedule       — Availability manager
/gym/[slug]/dashboard/trainer/bookings       — Booking requests
/gym/[slug]/dashboard/trainer/progress       — Record member measurements
/gym/[slug]/dashboard/trainer/messages       — Messaging

/admin                          — SuperAdmin overview (SUPERADMIN only)
/admin/tenants                  — All gym tenants
/admin/users                    — All users cross-tenant
```

---

## 📁 KEY FILES — READ THESE FIRST

| File | Purpose | Notes |
|------|---------|-------|
| `frontend/lib/tenant.ts` | Tenant context resolution + role guards | Use these in EVERY new API route |
| `frontend/lib/auth.ts` | NextAuth config (Google OAuth, JWT callbacks) | tenantId/role re-fetched from DB on every request |
| `frontend/lib/prisma.ts` | Prisma client singleton | Standard Prisma setup |
| `frontend/middleware.ts` | Subdomain + custom domain routing + auth guards | Allowlist maintained here |
| `frontend/prisma/schema.prisma` | Full database schema (518 lines) | Reference for all models |
| `frontend/.env` | All environment variables | DO NOT COMMIT |

---

## 🔐 ENVIRONMENT VARIABLES

```bash
# Database
DATABASE_URL=                    # PostgreSQL connection string

# NextAuth
NEXTAUTH_SECRET=                 # Random secret
NEXTAUTH_URL=                    # e.g. http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=               # For /api/ai/* routes

# Payments
PAYSTACK_SECRET_KEY=             # Server-side verification
PAYSTACK_PUBLIC_KEY=             # Client-side checkout popup (NEXT_PUBLIC_)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY= # Same key, public prefix

# Routing
NEXT_PUBLIC_ROOT_DOMAIN=         # e.g. localhost:3000 or smartgym.com
```

---

## 🚨 NEXT IMMEDIATE TASK — PHASE 9: CUSTOM DOMAIN VERIFICATION

### Goal
Gym owners can set a custom domain (e.g. `www.powergymbokja.com`) in their TenantSettings. The middleware already routes requests for custom domains to `/api/gym/resolve`. But there's no verification flow — a gym owner could type any domain and "claim" it.

### What Needs to be Built

**Step 1: Domain verification endpoint** `POST /api/tenant/verify-domain`
- Admin submits the custom domain they want to use
- Backend generates a `TXT record` verification token: `smartgym-verify=<random-token>`
- Stores token in `TenantSettings.customDomainVerifyToken`
- Returns instructions to the admin: add this DNS TXT record to your domain

**Step 2: Verification check endpoint** `POST /api/tenant/check-domain`
- Admin clicks "Verify" after adding DNS record
- Backend does a DNS TXT lookup for the domain
- If the token matches, sets `TenantSettings.domainVerified = true` and `customDomain = domain`
- Uses Node.js `dns.promises.resolve(domain, 'TXT')`

**Step 3: Schema update needed**
```prisma
// Add to TenantSettings:
customDomainVerifyToken   String?
domainVerified            Boolean  @default(false)
```

**Step 4: Admin UI in Website CMS** (`/dashboard/admin/website/info/page.tsx`)
- Show current custom domain
- Form to enter new domain
- Show verification instructions
- "Check Verification" button

**After domain verification**: Move to Flutterwave integration (alternative payment gateway).

### Why This Is Critical
Every `/api/ai/*` route (workout, nutrition, progress, chat) calls the Anthropic API at potentially non-trivial cost. Any authenticated user can call these endpoints in a loop — whether accidentally or maliciously — with no throttle. A single bad actor could run up significant API costs.

### How to Implement

**Step 1: Install Upstash Redis packages**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Step 2: Add env vars to `.env`**
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Step 3: Create `lib/ratelimit.ts`**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 10 AI requests per hour per user
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1h"),
  analytics: true,
});
```

**Step 4: Add to each `/api/ai/*` route** (after auth check, before AI call):
```typescript
import { aiRatelimit } from "@/lib/ratelimit";

const { success, limit, remaining } = await aiRatelimit.limit(session.user.id);
if (!success) {
  return NextResponse.json(
    { error: `AI rate limit exceeded. You have ${limit} requests per hour. Please try again later.` },
    { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
  );
}
```

**Routes to update**: `chat`, `workout`, `nutrition`, `progress` (4 files in `/api/ai/`)

**After rate limiting**: Move to `ai_logs` Prisma model, then TenantPlan feature gating.

### Why This Is Critical
Currently, payment flow is:
1. Member clicks "Get Started" on `/gym/[slug]`
2. `CheckoutButton.tsx` opens Paystack popup
3. On success, `onSuccess` callback calls `POST /api/payments/verify`
4. That endpoint verifies with Paystack REST API and creates a Subscription

**Problem**: If the browser closes, crashes, or loses connection AFTER Paystack charges the card but BEFORE the callback fires → user is charged but has no subscription.

**Solution**: Implement Paystack webhook that receives server-to-server confirmation.

### How to Implement Webhook

**File to create**: `frontend/app/api/payments/webhook/route.ts`

**Paystack webhook behavior**:
- Paystack sends `POST` to your webhook URL with event type `charge.success`
- Must verify the signature using `HMAC-SHA512` of raw body using `PAYSTACK_SECRET_KEY`
- Must respond with `200 OK` immediately (Paystack retries if you don't)

**Code pattern**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const expectedSig = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { reference, metadata } = event.data;
    // metadata should contain: planId, userId (set in CheckoutButton)
    // Look up plan, create subscription
    // Use metadata.planId to find MembershipPlan → get tenantId
    // Use metadata.userId to find or create MemberProfile
    // Create Subscription with status ACTIVE
  }

  return NextResponse.json({ received: true });
}
```

**Also needed**: Update `CheckoutButton.tsx` to pass `metadata: { planId, userId }` to Paystack so the webhook knows which plan was purchased.

**Also needed**: Add webhook URL to `middleware.ts` allowlist:
```typescript
if (pathname.startsWith("/api/payments/webhook")) return true;
```

---

## 📌 AFTER WEBHOOK — NEXT PRIORITY TASKS

In order of priority:

1. **Subscription expiry cron** — Create `frontend/app/api/cron/subscriptions/route.ts`
   - Call daily via Vercel Cron in `vercel.json`
   - Query `Subscription WHERE status=ACTIVE AND endDate < NOW()`
   - Update them to `INACTIVE`

2. **Rate limiting on AI routes** — Use Upstash Redis
   - Install: `@upstash/ratelimit` + `@upstash/redis`
   - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env`
   - Apply to `/api/ai/*` routes: 10 requests/hour per user

3. **Contact form backend** — Create `frontend/app/api/contact/route.ts`
   - Accepts: `{ name, email, message, slug }` 
   - Sends email via Resend API
   - Currently referenced in middleware allowlist but file doesn't exist

4. **`ai_logs` table** — Add to schema:
   ```prisma
   model AiLog {
     id        String   @id @default(cuid())
     tenantId  String
     userId    String
     feature   String   // "workout" | "nutrition" | "progress" | "chat"
     model     String
     tokens    Int?
     createdAt DateTime @default(now())
     @@index([tenantId, createdAt])
     @@index([userId])
   }
   ```

5. **TenantPlan feature gating** — Check `tenant.plan` before serving AI features
   - Create helper: `checkPlanFeature(tenantId, feature)` 
   - Add gate in AI routes for PROFESSIONAL/ENTERPRISE features

---

## 🏛️ ARCHITECTURE RULES — MUST FOLLOW

### Golden Rule: tenantId ALWAYS from session, never from request body

**Every API route must follow this pattern**:
```typescript
const session = await getAuthSession();
if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const ctx = getTenantContextFromSession(session);
if (!ctx?.tenantId) return noTenantContext();

// Now use ctx.tenantId for ALL DB queries
const results = await prisma.someModel.findMany({
  where: { tenantId: ctx.tenantId }  // ← ALWAYS scope by tenant
});
```

### Role Guards
```typescript
const roleErr = requireAdmin(ctx);       // ADMIN or SUPERADMIN
if (roleErr) return roleErr;

const roleErr = requireTrainer(ctx);     // TRAINER, ADMIN, or SUPERADMIN
if (roleErr) return roleErr;

const roleErr = requireSuperAdmin(ctx);  // SUPERADMIN only
if (roleErr) return roleErr;
```

### Cross-tenant resource check
```typescript
const resource = await prisma.someModel.findUnique({ where: { id } });
const ownerErr = assertTenantOwner(ctx, resource.tenantId);
if (ownerErr) return ownerErr;
```

### SUPERADMIN bypass
- SUPERADMIN has `tenantId = ""` or `undefined` in `getTenantContext()`
- All `requireXxx()` helpers allow SUPERADMIN through
- For cross-tenant queries: SUPERADMIN can pass `?tenantId=xxx` filter (see `/api/superadmin/users`)

---

## 🗂️ PROJECT STRUCTURE

```
c:\projects\gymA\
├── REQUIREMENT.md              ← Original vision document (read-only reference)
├── AGENT.md                    ← Architecture reference (legacy)
├── MULTI_TENANT_MIGRATION_TRACKER.md  ← Phase tracker (UPDATE EACH SESSION)
├── AI_HANDOFF.md               ← This file (UPDATE EACH SESSION)
├── backend/                    ← Empty / unused
└── frontend/                   ← Main application
    ├── .env                    ← Environment variables
    ├── middleware.ts            ← Routing + auth guards
    ├── next.config.ts           ← Next.js config
    ├── prisma/
    │   ├── schema.prisma        ← Database schema (518 lines)
    │   ├── migrations/          ← 10 migrations applied
    │   ├── scripts/
    │   │   └── backfill-tenant-ids.ts  ← Phase 2 backfill (already run)
    │   └── seed.ts
    ├── lib/
    │   ├── auth.ts              ← NextAuth config
    │   ├── prisma.ts            ← Prisma singleton
    │   └── tenant.ts            ← Tenant context + role helpers
    ├── types/                   ← TypeScript type extensions
    ├── components/
    │   ├── TenantThemeProvider.tsx
    │   ├── CheckoutButton.tsx   ← Paystack popup (needs metadata update)
    │   ├── admin/               ← Admin UI components
    │   ├── ai/                  ← AI panel components
    │   ├── community/           ← Social feed components
    │   ├── marketing/           ← Public page components
    │   ├── member/              ← Member UI components
    │   └── trainer/             ← Trainer UI components
    └── app/
        ├── (auth)/              ← Sign-in pages
        ├── (marketing)/         ← Platform-level marketing
        ├── (onboarding)/        ← New gym owner onboarding
        ├── (dashboard)/         ← Legacy (now redirects)
        ├── (superadmin)/admin/  ← SuperAdmin panel
        ├── gym/[slug]/          ← Per-tenant public site + dashboard
        └── api/                 ← All API routes
```

---

## 🐛 KNOWN BUGS / BLOCKERS

| Bug | Location | Impact | Fix |
|-----|----------|--------|-----|
| ~~No Paystack webhook~~ | ~~Missing file~~ | ~~🔴 CRITICAL~~ | ~~✅ FIXED Session 2~~ |
| ~~No subscription expiry~~ | ~~No cron~~ | ~~🔴 HIGH~~ | ~~✅ FIXED Session 2~~ |
| ~~No AI rate limiting~~ | ~~All `/api/ai/*`~~ | ~~🔴 HIGH~~ | ~~✅ FIXED Session 3~~ |
| ~~Contact form was 404~~ | ~~`/api/contact`~~ | ~~🟡 MEDIUM~~ | ~~✅ FIXED Session 2~~ |
| No custom domain verification | TenantSettings | 🟡 MEDIUM — anyone can claim any domain | Phase 9 next |
| No image uploads | CMS editor | 🟡 MEDIUM — admin must use external URLs | Add Cloudinary/S3 |
| `TenantPlan` not enforced | All features | 🟡 MEDIUM — FREE plan gets everything | Phase 10 |

---

## 📋 HOW TO RUN THE PROJECT

```bash
cd c:\projects\gymA\frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → Runs at http://localhost:3000

# Prisma operations
npx prisma studio          # Visual DB browser
npx prisma db push         # Push schema changes without migrations
npx prisma migrate dev     # Create + apply new migration
npx prisma generate        # Regenerate Prisma client after schema change

# Run backfill script (already done — DO NOT RUN AGAIN unless you reset the DB)
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/scripts/backfill-tenant-ids.ts
```

---

## 🔗 KEY RELATIONSHIPS TO REMEMBER

```
Tenant
  ↓ (one-to-many)
User (tenantId → Tenant.id, nullable for SUPERADMIN)
  ↓
MemberProfile (userId → User.id)
  ├── Subscription (memberId, tenantId)
  ├── WorkoutPlan (memberId, tenantId)
  ├── MealPlan (memberId, tenantId)
  ├── FoodLog (memberId, tenantId)
  ├── ProgressRecord (memberId, tenantId)
  ├── Booking (memberId → MemberProfile, trainerId → TrainerProfile, tenantId)
  └── Attendance (memberId, tenantId)

TrainerProfile (userId → User.id)
  ├── Booking (trainerId)
  └── WorkoutPlan (trainerId, optional)

Tenant
  ├── TenantSettings (1:1, branding + CMS JSON blobs)
  ├── MembershipPlan (tenantId)
  ├── BlogPost (tenantId)
  ├── Post (tenantId) — community posts
  ├── Challenge (tenantId)
  ├── Message (tenantId)
  └── Notification (tenantId)
```

---

## 📅 SESSION LOG

| Date | Session Work | Who |
|------|-------------|-----|
| Jun 10, 2026 | Created MULTI_TENANT_MIGRATION_TRACKER.md + AI_HANDOFF.md from full codebase scan | Antigravity AI |
| Jun 10, 2026 | Phase 7: Paystack webhook, subscription cron, contact form API + UI, CheckoutButton metadata, middleware updates | Antigravity AI |
| Jun 10, 2026 | Phase 8: Upstash Redis rate limiter, AiLog model + migration, logging in all AI routes, admin AI usage analytics page | Antigravity AI |

---

## ✅ CONTINUITY CHECKLIST (RUN AT END OF EVERY SESSION)

Before finishing any session, update:

1. **AI_HANDOFF.md**:
   - [ ] Update "Current Phase" and "Current Status"
   - [ ] Update "Next Immediate Task" section
   - [ ] Add entry to Session Log table
   - [ ] Update any known bugs/blockers
   - [ ] Add any new API routes or pages to the lists

2. **MULTI_TENANT_MIGRATION_TRACKER.md**:
   - [ ] Mark any newly completed tasks as `✅`
   - [ ] Update phase status (Not Started → In Progress → Complete)
   - [ ] Add new rows to the Master Migration Table for any new work
   - [ ] Update the "Last Updated" date at the bottom

---

*Last Updated: June 10, 2026 — Session 3*
*Updated By: Antigravity AI — Phase 8 complete*
*Next Session Should Start At: Phase 9 — Custom Domain Verification Flow*
