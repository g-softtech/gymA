# CortexFit Reference Implementation

**Status:** Production Ready / Feature Freeze  
**Last Updated:** August 2026

This document serves as the master operating manual and architecture guide for the CortexFit platform. If you are joining this project, reading this document will give you a comprehensive understanding of the system's design, philosophies, and operational requirements.

---

## 1. Architecture Overview

CortexFit is an Enterprise B2B2C SaaS platform built for the fitness industry. It is a multi-tenant system allowing gym owners to manage memberships, billings, access control, and their public web presence.

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Hosting:** Vercel (Frontend & Serverless APIs)
- **Authentication:** Magic Links & NextAuth / Custom Auth
- **Billing:** Stripe (via webhooks and entitlement registry)

---

## 2. Folder Structure

The repository is structured to separate concerns between the core SaaS product, tenant landing pages, and administrative dashboards.

```
cortexfit/
├── app/
│   ├── (marketing)/       # CortexFit's own marketing pages and pricing
│   ├── api/               # Serverless API routes and webhooks
│   ├── auth/              # Magic Link and authentication flows
│   ├── gym/[slug]/        # Dynamic Tenant Landing Pages (Programmatic SEO)
│   │   ├── dashboard/     # Tenant internal dashboards (Admin, Member, Trainer)
│   ├── sitemap.xml/       # Sitemap Index for massive scale
├── components/            # Reusable React components (Tailwind / Radix UI)
├── docs/                  # Architecture Decision Records (ADRs) and Launch Checklists
├── lib/
│   ├── analytics/         # Server-side event tracking and UTM attribution
│   ├── auth/              # JWT and Session management
│   ├── billing/           # Entitlements and Stripe logic
│   ├── email/             # Transactional email queue and templates
│   ├── seo/               # Programmatic SEO generators (JSON-LD, Metadata)
│   └── tenant/            # Tenant resolution and vanity URL logic
├── prisma/                # Database schema and migrations
```

---

## 3. Database Philosophy

We use a **logical isolation** multi-tenant model. 
- All tenants share the same PostgreSQL database.
- Every record belonging to a tenant *must* include a `tenantId`.
- **Golden Rule:** All Prisma queries fetching tenant-specific data must explicitly include `where: { tenantId }`.

---

## 4. Billing & Entitlements Philosophy

We do not hardcode Stripe Price IDs into the UI. Instead, we use a **Capability-Based Entitlement** system (`lib/entitlements/registry.ts`).
- Plans grant capabilities (e.g., `MAX_MEMBERS: 500`, `CUSTOM_DOMAIN: true`).
- The codebase checks capabilities, not plan names.
- Webhooks asynchronously update the local database to keep the source of truth fast and available without hitting Stripe's API.

---

## 5. Security Philosophy

Security is enforced at the edge and at the data access layer:
- **Middleware:** `middleware.ts` handles multi-tenant routing, checks authentication for dashboard access, and applies rate limiting to prevent abuse.
- **Role-Based Access Control (RBAC):** Users are assigned roles (Super Admin, Gym Admin, Trainer, Member) which dictates dashboard routing and API access.
- **Authentication:** We prefer passwordless Magic Links to reduce friction and eliminate password breach vectors.

---

## 6. Email Architecture

Emails are never sent synchronously within API requests.
- We utilize an **Email Queue** in the database.
- A background worker processes the queue and dispatches transactional templates (Welcome Emails, Billing Receipts, Magic Links).
- This ensures fast API response times and built-in retry mechanisms for failed deliveries.

---

## 7. Analytics Architecture

We have moved beyond "just having analytics" to a full attribution funnel.
- **UTM Tracking:** `UtmTracker` stores UTM parameters in a first-party cookie.
- **Event Bus:** `lib/analytics/index.ts` is the single entry point (`trackEvent`) for all analytics, broadcasting to Google Analytics and Microsoft Clarity.
- **Privacy:** PII (Personally Identifiable Information) is strictly excluded from analytics payloads.

---

## 8. SEO Architecture

CortexFit employs an aggressive **Programmatic SEO** engine.
- Every gym onboarded automatically generates a highly optimized landing page (`fit.thecortexsystems.com/gym/[slug]`).
- **JSON-LD Schema:** The `lib/seo` module automatically injects `HealthClub`, `Organization`, and `SoftwareApplication` schemas.
- **SEO Health Score:** Gym owners have a gamified dashboard evaluating their SEO completeness (Bronze, Silver, Gold) to encourage them to build better pages, driving organic traffic to the platform.
- **Segmented Sitemaps:** Sitemaps are segmented (`sitemap-marketing.xml`, `sitemap-gyms.xml`) via an index to scale endlessly.

---

## 9. Background Worker Architecture

Heavy operations are offloaded to background queues or serverless cron jobs:
- Email dispatching
- Analytics aggregation
- Stripe webhook reconciliation
- SEO sitemap regeneration

---

## 10. Coding Standards

- **React Server Components (RSC):** Default to Server Components for data fetching. Use `'use client'` only when interactivity or browser APIs (like `useSearchParams`) are required.
- **Tailwind CSS:** Use semantic tokens and CSS variables mapped in `globals.css` rather than hardcoded colors, ensuring our dark mode and tenant theme providers work flawlessly.
- **Error Handling:** APIs must return structured JSON responses. Do not leak stack traces to the client.

---

## 11. ADR Index (Architecture Decision Records)

All major architectural decisions are documented in `docs/architecture/`.
- `ADR-013`: Analytics Taxonomy
- `ADR-014`: UTM Attribution Strategy
- `ADR-015`: Launch Readiness Guidelines

---

## 12. Deployment Process

CortexFit is designed for continuous deployment via Vercel.
- **Main Branch:** Pushes to `main` trigger production deployments.
- **Environment Variables:** Must be synced via the Vercel dashboard. Critical keys include `DATABASE_URL`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- **Database Migrations:** Prisma migrations run automatically during the build phase via a `postinstall` or custom build script.

---

## 13. Release Checklist

Before any major launch, consult the Launch Command Center located at:
`docs/launch/00-launch-checklist.md`

This includes mandatory checks for:
- Google Search Console Integration
- Error Monitoring (Sentry/BetterStack)
- Production Database Backups
- GDPR Cookie Consent Mechanisms
