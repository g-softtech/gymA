# ADR-002: Subscription Domain Events

## Context

As the billing domain evolves, side-effects such as Cache Invalidation, Audit Logging, and Notifications are currently handled imperatively inside Webhook processors and API routes.
This imperative approach tightly couples business logic with infrastructure operations, reducing testability and increasing the likelihood of failing an entire critical transaction because a non-critical side-effect (like sending an email) threw an error.

## Decision

We are adopting a **Domain Event-Driven Architecture** for the Subscription boundary (`lib/subscriptions/events/*`).

- **Domain Ownership**: Events belong strictly to the domain that emits them. We will not build a generic platform-wide Event Bus yet. Subscriptions own `SubscriptionEvents`.
- **Event Contracts**: Events are explicitly modeled as strongly-typed unions (e.g. `SubscriptionRenewedEvent`) containing structural guarantees (`version`, `correlationId`, `causationId`, `actorId`, `tenantId`, `occurredAt`).
- **Synchronous Pub/Sub (Vercel)**: Since our API endpoints run on Vercel Serverless Functions, we must explicitly `await` subscribers inside the HTTP response context to prevent the function from freezing before side effects execute.
- **Natural Idempotency**: Handlers should be designed to execute safely multiple times (e.g. `revalidateTag` or updating Prisma statuses).

### Error Handling Policy
- **Event Bus Agnosticism**: The `EventBus` executes all handlers using a sequential `try/catch` and returns an aggregate `PublishResult` object containing `successfulHandlers`, `failedHandlers`, and an array of `failures`. 
- **Preserve Business State**: We prioritize the accuracy of the HTTP response (which reflects the successfully committed database transaction) over the strict execution of side-effects. 
- **Operational Failures**: Failures in Cache Invalidation or Audit Logging are treated as *operational* failures. They are aggressively logged, monitored, and collected in the `PublishResult`, but they do **NOT** throw a 500 HTTP response. Stale caches or delayed logs are preferable to lying to a client or webhook provider that a payment failed when it actually succeeded in the DB.

## Consequences

- **Positive**: Adding new downstream integrations (like Analytics or Mobile Push) requires zero changes to the core `paymentFulfillment` logic.
- **Positive**: A comprehensive `AuditLog` table now guarantees an immutable timeline of all tenant subscription state changes.
- **Negative**: Developers must remember to publish events instead of writing side effects inline.

## Status

**Accepted** (2026-07-06)
