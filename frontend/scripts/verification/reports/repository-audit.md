# Repository Audit Report

Total Findings: 30
Unauthorized Mutations: 0

| File | Line | Pattern | Allowed | Reason |
| ---- | ---- | ------- | ------- | ------ |
| app/api/admin/revenue/refund/route.ts | 40 | `Transaction DB Mutation (update)` | ✅ | Authorized lifecycle owner |
| app/api/cron/subscriptions/route.ts | 61 | `Subscription DB Mutation (update)` | ✅ | Authorized lifecycle owner |
| app/api/member/subscription/route.ts | 109 | `Subscription DB Mutation (update)` | ✅ | Authorized lifecycle owner |
| app/api/payments/initialize/route.ts | 113 | `Transaction DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| app/api/webhooks/platform-billing/route.ts | 45 | `BillingEvent DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| lib/paymentFulfillment.ts | 227 | `Transaction DB Mutation (update)` | ✅ | Authorized lifecycle owner |
| scripts/billing-disaster-recovery.ts | 42 | `Tenant DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/billing-disaster-recovery.ts | 118 | `BillingEvent DB Mutation (delete)` | ✅ | Authorized lifecycle owner |
| scripts/cleanup-tenants.ts | 56 | `Subscription DB Mutation (delete)` | ✅ | Authorized lifecycle owner |
| scripts/cleanup-tenants.ts | 59 | `Transaction DB Mutation (delete)` | ✅ | Authorized lifecycle owner |
| scripts/fill-sandboxes.ts | 96 | `Subscription DB Mutation (delete)` | ✅ | Authorized lifecycle owner |
| scripts/fill-sandboxes.ts | 101 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 13 | `Transaction DB Mutation (delete)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 16 | `Subscription DB Mutation (delete)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 51 | `Transaction DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 96 | `Transaction DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 131 | `Transaction DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 175 | `Transaction DB Mutation (update)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 188 | `Transaction DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/phase15_audit.ts | 240 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-bodyline.ts | 112 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-demo.ts | 104 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-marketing.ts | 11 | `Tenant DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-marketing.ts | 125 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-sandboxes.ts | 119 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-tenant.ts | 34 | `Tenant DB Mutation (delete)` | ✅ | Authorized lifecycle owner |
| scripts/seed-tenant.ts | 51 | `Tenant DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-tenant.ts | 141 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-tenant.ts | 161 | `Subscription DB Mutation (create)` | ✅ | Authorized lifecycle owner |
| scripts/seed-test-users.ts | 24 | `Tenant DB Mutation (create)` | ✅ | Authorized lifecycle owner |
