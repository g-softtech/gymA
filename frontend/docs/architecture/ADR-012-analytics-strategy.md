# ADR 012: Analytics Strategy and Event Tracking Architecture

## Status
Accepted

## Context
As CortexFit approaches launch, we need visibility into marketing acquisition, product adoption, and billing conversion. We need an analytics strategy that handles standard page views and complex funnel events, while remaining respectful of our multi-tenant architecture and strict privacy standards.

## Decision

1. **Provider**: We selected **Google Analytics 4 (GA4)** via the official `@next/third-parties/google` package as the foundational provider. It is industry-standard, well-supported in Next.js, and offers powerful Enhanced Measurement out-of-the-box.
2. **Centralized Wrapper**: We implemented `trackEvent()` in `lib/analytics/google.ts`. No component should ever call `window.gtag` directly.
3. **Event Registry**: All event names are strictly typed via the `ANALYTICS_EVENTS` constant in `lib/analytics/events.ts`. Ad-hoc strings are prohibited.
4. **PII Policy**: No Personally Identifiable Information (PII) may be sent to the tracking provider. This includes names, emails, phone numbers, and street addresses.
5. **Multi-Tenant Context**: For product events, we attach `tenant_slug` and `tenant_plan` to the event payload. This enables segmentation of features by gym size and plan.
6. **Future Extensibility**: The `trackEvent()` abstraction allows us to seamlessly drop in Mixpanel, PostHog, or Meta Pixel in the future without touching any React component logic.

## Consequences
- Developers must import `ANALYTICS_EVENTS` and `trackEvent` for all new features.
- We have immediate visibility into the marketing funnel (e.g., `signup_initiated`) and core product flows.
- We remain compliant with GA4 terms of service regarding PII.
