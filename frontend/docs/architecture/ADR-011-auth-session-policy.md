# ADR 011: Authentication & Session Policy

## Status
Accepted

## Context
As CortexFit scales, we need a robust, explicitly defined authentication policy. Relying on default framework configurations (NextAuth) creates ambiguity. We must formalize our session lifetimes, magic link validities, and define a roadmap for future enterprise security capabilities (like Device Management and Step-Up Authentication) to align with enterprise B2B SaaS standards.

## Decision

We have explicitly configured our NextAuth implementation to strictly adhere to the following policies:

### 1. Magic Link Authentication
- **Mechanism**: Passwordless authentication via NextAuth `EmailProvider`.
- **Token Validity**: `maxAge` is set to **15 minutes**.
- **Rationale**: Short-lived verification tokens mitigate the risk of stolen links in email inboxes. Eliminating passwords prevents password reuse and weak passwords.

### 2. Session Configuration
- **Strategy**: `jwt` (JSON Web Token) with Database adapter logic overlay.
  - *Note*: We maintain `strategy: "jwt"` instead of `"database"` because our existing `jwt` and `session` callbacks are heavily instrumented to perform database lookups and hydrate session context (tenant routing, roles, forensic logging). Using `database` strategy would bypass the `jwt` callback and break the current routing.
- **Session Lifetime**: `maxAge` is **30 days** (2,592,000 seconds).
- **Sliding Expiration**: `updateAge` is **24 hours** (86,400 seconds).
- **Rationale**: A 30-day session provides an optimal balance between security and user experience. Gym owners and staff should not experience "login fatigue" by being forced to re-authenticate daily.

### 3. Cookies
- We utilize NextAuth's default secure cookie policy.
- In production (`VERCEL_ENV=production`), cookies are automatically set to `Secure`, `HttpOnly`, and `SameSite=Lax`.

## Future Roadmap (Phase 2+)
To balance the 30-day session lifetime, we will implement the following enterprise security enhancements in future iterations:

1. **Step-Up Authentication (Phase 2)**: High-risk actions (e.g., changing payouts, transferring ownership) will require `authenticatedAt <= 15 minutes`. If older, a fresh magic link will be enforced.
2. **Device Management & Separation of Concerns (Phase 3-4)**: We will create a discrete `UserDeviceSession` table to track devices without overloading NextAuth's internal `Session` table.
3. **Immutable Audit Logging (Phase 5)**: Tracking high-risk actions.
4. **Risk Detection (Phase 6)**: Detecting impossible travel and new devices.
