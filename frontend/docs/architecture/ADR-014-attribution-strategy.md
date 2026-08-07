# ADR 014: Attribution Strategy

## Status
Accepted

## Context
When a user signs up for CortexFit, we need to know exactly which marketing channel brought them there (e.g., Google Ads, organic search, referral). If UTM parameters are only present on the landing page (`/`), they are lost as soon as the user navigates to `/pricing` or `/signup`.

## Decision
1. **Client-Side Cookie**: We implemented a `UtmTracker` client component that listens to `useSearchParams`. When UTM parameters are detected, it serializes them into a `cortexfit_utm` cookie.
2. **First-Party, JS-Readable**: Crucially, this cookie is *not* `HttpOnly`. It must be readable by client-side JavaScript so that the `trackEvent()` wrapper in `lib/analytics/index.ts` can extract the UTM parameters and append them to downstream events.
3. **Fields Captured**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landing_page`, and `referrer`.
4. **Lifespan**: The attribution cookie lives for 30 days.

## Consequences
- The original acquisition channel is accurately attributed to the `GYM_CREATED` and `PAYMENT_SUCCESS` events, even if those occur days after the initial visit.
- We must respect Cookie Consent banners for European traffic, potentially delaying the setting of this cookie until consent is granted.
