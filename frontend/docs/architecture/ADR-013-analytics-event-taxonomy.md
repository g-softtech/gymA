# ADR 013: Analytics Event Taxonomy

## Status
Accepted

## Context
A major challenge in SaaS analytics is "event sprawl," where developers create slightly different names for the same user action (e.g., `signup`, `signup_started`, `user_signup`). This pollutes GA4 and makes funnel analysis impossible. We need a strict taxonomy covering the entire SaaS lifecycle (Awareness, Acquisition, Activation, Revenue, Retention).

## Decision
1. **Single Source of Truth**: All events MUST be defined in `lib/analytics/events.ts` within the `ANALYTICS_EVENTS` constant.
2. **Naming Convention**: Events must be `SCREAMING_SNAKE_CASE` in the codebase but map to lowercase `snake_case` in the actual tracking payload (e.g. `SIGNUP_INITIATED` -> `"signup_initiated"`).
3. **Lifecycle Coverage**:
   - **Awareness**: `landing_page_viewed`, `pricing_viewed`, `faq_viewed`
   - **Acquisition**: `signup_initiated`, `magic_link_sent`, `gym_created`, `onboarding_completed`
   - **Activation**: `first_member_added`, `first_plan_created`
   - **Revenue**: `checkout_started`, `payment_success`, `plan_upgraded`
   - **Retention**: `login`, `active_member`, `report_exported`
4. **No Free-text Events**: Components cannot call `trackEvent("my_custom_string")`. TypeScript will reject any string not found in `AnalyticsEvent`.

## Consequences
- Developers are forced to consult `events.ts` before adding new tracking, preventing duplicates.
- Marketing and Product teams have a guaranteed, stable funnel to build reports on.
