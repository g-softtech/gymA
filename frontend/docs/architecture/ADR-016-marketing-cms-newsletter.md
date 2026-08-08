# ADR 016: Marketing CMS & Newsletter Architecture

## Status
Accepted

## Context
CortexFit requires a mechanism to publish marketing content (blog posts) and capture leads via a newsletter subscription form. The existing architecture contains a `BlogPost` model that is strictly scoped to a `tenantId` (for individual gyms). Overloading this model for global platform marketing introduces risks of data leakage, accidental multi-tenant scoping bugs, and clutters the schema. Furthermore, the platform already has robust authorization (`SuperAdmin`) and transactional email delivery mechanisms (`EmailJob`).

## Decision
We implemented a strict separation of concerns for the global marketing presence:
1. **Database Segregation**: Created a new `MarketingBlog` model, completely decoupled from `Tenant`, dedicated solely to global platform content.
2. **Super Admin Access**: Placed the CMS API and Editor within the `/superadmin` and `/admin` boundaries, leveraging the existing `requireSuperAdmin` RBAC middleware.
3. **Idempotent Newsletter Subscription**: The `NewsletterSubscriber` model relies on an `@unique` email constraint, ensuring atomic deduplication. The API dispatches an `EmailJob` (`NEWSLETTER_WELCOME`) with a deterministic `eventId`, guaranteeing that duplicate queue insertions are gracefully discarded by Prisma without failing the user request.
4. **Markdown Rendering**: Installed `react-markdown` and `remark-gfm` to safely parse Markdown content stored in `MarketingBlog.content` on the public Next.js React client, avoiding the need for `rehype-raw` or dangerous HTML injection.
5. **SEO & Analytics**: Integrated directly with `lib/seo/metadata.ts`, `lib/seo/jsonld.ts`, and `lib/analytics/events.ts` to inherit existing Google-approved structured data and tracking schemas without duplicating effort.

## Consequences
- **Positive**: Marketing content is securely isolated from tenant data.
- **Positive**: Newsletter welcome emails are immune to race conditions or duplicate submissions.
- **Positive**: The platform’s SEO capabilities remain centrally managed and pristine.
- **Negative**: Adds a dependency (`react-markdown`) strictly for the public blog, slightly increasing the client bundle size on those routes.
