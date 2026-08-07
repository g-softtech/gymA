# Operations Checklist

## Monitoring & Alerting
- [ ] Error tracking (Sentry / BetterStack / OpenTelemetry) implemented and tested.
- [ ] Uptime monitoring (Pingdom / BetterStack) configured for root domain and APIs.
- [ ] Email alerts configured for failed background jobs / webhook failures.

## Internal Tooling
- [ ] Super Admin Dashboard operational (Marketing, Business, Product metrics).
- [ ] Feature flags platform configured (if applicable).
- [ ] Manual override access for subscription management tested.

## Email Operations
- [ ] Dedicated sending domain authenticated (DKIM/SPF/DMARC) via Resend.
- [ ] Transactional email limits reviewed.
