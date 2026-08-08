# CortexFit v1.0.0 Reference Certification

This document tracks the objective evidence required to declare a subsystem "Launch Certified." A subsystem cannot be marked certified until empirical evidence (logs, successful test runs, screenshots, or metrics) is provided.

## Subsystem Certification Matrix

| Subsystem      | Status      | Evidence Required | Empirical Evidence Verified |
| -------------- | ----------- | ----------------- | --------------------------- |
| Authentication | ⏳ Pending   | Build + login test + logout test | [Pending Verification] |
| Billing        | ⏳ Pending   | Successful Paystack payment + webhook replay test | [Pending Verification] |
| Email          | ⏳ Pending   | Queue processed + EmailLog created | [Pending Verification] |
| SEO            | ✅ Certified   | Rich Results Test passed | Sitemap Index successfully fetched and parsed by Google Search Console |
| Analytics      | ⏳ Pending   | GA4 DebugView verified | [Pending Verification] |
| Multi-tenancy  | ⏳ Pending   | Cross-tenant isolation tests passed | [Pending Verification] |
| Dashboard      | ⏳ Pending   | Super Admin operational metrics load | [Pending Verification] |

## Production Validation Checklist

Before removing the `Pending` status above, the following real-world workflows must be manually verified in a staging or production-like environment:

### New Gym Owner Workflow
- [ ] Signup via Magic Link
- [ ] Magic link received in inbox
- [ ] Onboarding wizard completed
- [ ] Trial Stripe/Paystack subscription created
- [ ] Dashboard opens successfully

### Gym Member Workflow
- [ ] Member added by Admin
- [ ] Welcome email dispatched from queue
- [ ] Payment successfully processed
- [ ] Payment receipt emailed

### Billing Lifecycle
- [ ] Plan upgrade successful
- [ ] Plan renewal webhook processed
- [ ] Failed payment webhook triggers restriction
- [ ] Payment retry succeeds and restores access

### Admin Operations
- [ ] Suspend tenant (verify login blocked)
- [ ] Resume tenant (verify login restored)
- [ ] View audit logs for tenant
- [ ] Export tenant data
