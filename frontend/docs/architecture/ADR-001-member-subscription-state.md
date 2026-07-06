# ADR-001: Canonical Member Subscription State

## Context

As the billing domain grew, we observed multiple independent implementations for determining whether a member's subscription was active, expired, or pending. For example, inline logic such as `sub.status === "ACTIVE" && sub.endDate > new Date()` was scattered across:
- The UI (e.g., Member Lists and Dashboards)
- Webhooks (e.g., `paymentFulfillment.ts`)
- API Routes

This duplication introduced several risks:
- **Inconsistency**: Different parts of the system might calculate status slightly differently (e.g., strict less-than vs. less-than-or-equal, timezone differences).
- **Maintenance Burden**: Adding new states (like grace periods, pauses, or family plans) would require updating logic scattered across the codebase.
- **Testing**: Impossible to test the evaluation logic exhaustively in one place.

## Decision

We have introduced a **Canonical Subscription State Helper** to serve as the single source of truth for evaluating a member's subscription health.

- **Location**: `lib/subscriptions/memberSubscriptionState.ts`
- **Ownership**: The `subscriptions` domain module exclusively owns the logic for interpreting subscription state.
- **Rule**: No module outside of `lib/subscriptions` is allowed to independently evaluate raw dates or status strings to determine if a member is active.

### Allowed Patterns

Consumers must use the provided helpers:
- `isSubscriptionActive(subscription, referenceDate)` - Boolean check for current validity.
- `getSubscriptionHealthState(subscription, referenceDate)` - Returns a normalized state (`ACTIVE`, `EXPIRED`, `SUSPENDED`, `PENDING_PAYMENT`, `CANCELLED`, `REPLACED`).

## Consequences

- **Positive**: Bug fixes and new state logic (e.g., adding a 3-day grace period) can be implemented in exactly one place and will propagate correctly to Webhooks, API Routes, and Dashboards.
- **Positive**: We have established a dedicated domain boundary for subscriptions (`lib/subscriptions/*`), improving enterprise maintainability.
- **Negative**: Developers must remember to import the helper rather than writing quick inline checks. This ADR serves as documentation to prevent regressions.

## Status

**Accepted** (2026-07-06)
