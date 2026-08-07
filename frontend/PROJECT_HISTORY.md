# CortexFit: Project History & Evolution

This document tracks the "Why" behind CortexFit. It is intended for future maintainers to understand the context of architectural decisions and the evolution of the platform.

## 1. Why CortexFit Exists
CortexFit was born out of a need for a modern, mobile-first, and highly reliable gym management operating system tailored for the African market (starting with Nigeria), but capable of scaling globally. Existing solutions were often clunky, lacked proper multi-tenancy, or did not integrate well with regional payment gateways like Paystack.

## 2. Evolution Timeline
- **Phase 1: Proof of Concept** - Built the foundational Next.js App Router setup with Prisma and a basic Magic Link auth.
- **Phase 2: Multi-Tenancy Engine** - Implemented logical isolation (`tenantId`), middleware routing for vanity URLs, and dynamic themes.
- **Phase 3: The Billing Engine** - Rejected hardcoded Stripe plans in favor of a Capability-Based Entitlement model (`lib/entitlements`). This allowed for seamless integration of both Stripe and Paystack without tying the codebase to a specific provider's plan IDs.
- **Phase 4: Operational Maturity** - Shifted focus from feature delivery to background queues (emails), server-side analytics, programmatic SEO, and launch hardening.

## 3. Major Architectural Decisions

### 3.1. Capability-Based Entitlements over Hardcoded Plans
**Why:** Gyms frequently request custom pricing or grandfathered plans. Tying UI logic to a specific Stripe Price ID meant constant code deployments to support new billing tiers. By mapping plans to capabilities (e.g., `MAX_MEMBERS: 500`), the codebase only checks what a tenant is *allowed* to do, regardless of how much they pay.

### 3.2. Background Email Queue
**Why:** Transactional emails (like receipts or welcome emails) can take 1-3 seconds to dispatch via third-party APIs (Resend). Doing this synchronously within an API request leads to slow UX and timeout errors on Vercel. We introduced a database-backed queue to decouple email sending from user actions.

### 3.3. First-Party UTM Tracking (UtmTracker)
**Why:** `HttpOnly` cookies are great for security but block client-side JavaScript from reading UTM parameters necessary for Google Analytics and Microsoft Clarity events. We opted for a first-party readable cookie specifically for marketing attribution.

### 3.4. Magic Links over Passwords
**Why:** Fitness professionals and gym members often forget passwords, leading to high support volume. Magic Links offload authentication security to the user's email provider, simplifying our security model and eliminating password breaches.

## 4. Features Intentionally Rejected
- **Microservices Architecture:** Rejected in favor of a modular monolith. The operational overhead of managing multiple deployments and inter-service communication would slow down iteration speed.
- **Redux / Global State Management:** Rejected in favor of React Server Components and React Query. The platform relies heavily on server-side data fetching, making heavy client-side state managers redundant and bloated.
