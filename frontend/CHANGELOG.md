# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-07

### Added
- **Multi-Tenancy Engine:** Logical isolation using `tenantId` across all PostgreSQL tables.
- **Vanity URLs:** Middleware-driven dynamic routing for gym tenant subdomains/paths.
- **Programmatic SEO Engine:** Automatic generation of `HealthClub` JSON-LD schemas and Segmented Sitemaps for all tenants.
- **SEO Health Score Dashboard:** Gamified Bronze/Silver/Gold tiering with AI Assistant recommendations for gym owners.
- **Capability-Based Entitlements:** Billing system decoupled from Stripe Price IDs, supporting dynamic feature access via the `lib/entitlements` registry.
- **Background Email Queue:** Database-backed transactional email system to prevent API timeouts during signup/receipt delivery.
- **First-Party Analytics:** `UtmTracker` and central `lib/analytics` bus broadcasting events to GA4 and Microsoft Clarity.
- **Operational Runbooks:** Created comprehensive documentation for disaster recovery, failed deployments, and webhook failures.
- **Reference Certification Matrix:** Objective tracking of subsystem readiness for production launch.

### Changed
- Refactored `app/sitemap.ts` to output a Sitemap Index pointing to segmented sitemaps (`sitemap-marketing.xml`, etc) for infinite scalability.
- Enhanced `app/robots.ts` to explicitly block all dashboard, billing, and administrative routes from search engine crawlers.
- Migrated global metadata configuration from `app/layout.tsx` to a centralized `lib/seo/metadata.ts` module.

### Security
- **Magic Links:** Replaced traditional password authentication with secure, short-lived email tokens.
- **Edge Rate Limiting:** Applied request throttling within `middleware.ts` to protect sensitive API endpoints.
- **RBAC (Role-Based Access Control):** Enforced strict role checks (Super Admin, Gym Admin, Trainer, Member) at both the edge middleware and data access layers.
