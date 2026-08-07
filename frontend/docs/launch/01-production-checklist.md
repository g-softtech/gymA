# Production Checklist

## Infrastructure & Hosting
- [ ] Vercel production environment variables verified.
- [ ] Database (PostgreSQL/Supabase) provisioned for production capacity.
- [ ] Redis (Upstash) provisioned for production capacity.
- [ ] CDN caching headers verified for static assets.

## Domain & SSL
- [ ] Root domain `fit.thecortexsystems.com` fully propagated.
- [ ] Wildcard SSL certificate active for `*.thecortexsystems.com`.

## Performance
- [ ] Lighthouse scores > 90 on mobile for marketing pages.
- [ ] API latency < 200ms for core routes.
