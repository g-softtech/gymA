# Build Verification Report

### Command: `npx prisma validate`
**Exit Code:** 0
```text
The schema at prisma\schema.prisma is valid 🚀
```

### Command: `npx tsc --noEmit`
**Exit Code:** 0
```text

```

### Command: `npm run build`
**Exit Code:** 0
```text
> frontend@0.1.0 build
> next build

▲ Next.js 16.2.6 (Turbopack)
- Environments: .env.production.local, .env

  Creating an optimized production build ...
✓ Compiled successfully in 19.4s
  Running TypeScript ...
  Finished TypeScript in 23.4s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/96) ...
  Generating static pages using 11 workers (24/96) 
  Generating static pages using 11 workers (48/96) 
  Generating static pages using 11 workers (72/96) 
✓ Generating static pages using 11 workers (96/96) in 1474ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ƒ /admin
├ ƒ /admin/billing
├ ƒ /admin/tenants
├ ƒ /admin/users
├ ƒ /api/admin/ai-usage
├ ƒ /api/admin/branding
├ ƒ /api/admin/checkin
├ ƒ /api/admin/checkin/lookup
├ ƒ /api/admin/classes
├ ƒ /api/admin/classes/[id]
├ ƒ /api/admin/domains
├ ƒ /api/admin/domains/verify
├ ƒ /api/admin/entitlements/audit
├ ƒ /api/admin/intelligence/actions
├ ƒ /api/admin/intelligence/actions/approve
├ ƒ /api/admin/intelligence/overview
├ ƒ /api/admin/memberships/plans
├ ƒ /api/admin/memberships/plans/[planId]
├ ƒ /api/admin/plans-list
├ ƒ /api/admin/promote
├ ƒ /api/admin/revenue
├ ƒ /api/admin/revenue/overview
├ ƒ /api/admin/revenue/refund
├ ƒ /api/admin/trainers
├ ƒ /api/admin/users
├ ƒ /api/ai/chat
├ ƒ /api/ai/nutrition
├ ƒ /api/ai/progress
├ ƒ /api/ai/workout
├ ƒ /api/analytics/churn-risk
├ ƒ /api/analytics/entitlements
├ ƒ /api/analytics/gym/overview
├ ƒ /api/analytics/heatmap
├ ƒ /api/analytics/member/[id]
├ ƒ /api/analytics/membership
├ ƒ /api/analytics/plan-performance
├ ƒ /api/analytics/revenue
├ ƒ /api/analytics/trainers
├ ƒ /api/analytics/upgrades
├ ƒ /api/attendance
├ ƒ /api/attendance/export
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/auth/logout
├ ƒ /api/auth/register
├ ƒ /api/billing/initialize
├ ƒ /api/billing/plans
├ ƒ /api/billing/status
├ ƒ /api/blog
├ ƒ /api/blog/[postId]
├ ƒ /api/bookings
├ ƒ /api/bookings/[bookingId]
├ ƒ /api/community/challenges
├ ƒ /api/community/challenges/[challengeId]/join
├ ƒ /api/community/posts
├ ƒ /api/community/posts/[postId]/comments
├ ƒ /api/community/posts/[postId]/like
├ ƒ /api/contact
├ ƒ /api/cron/attendance
├ ƒ /api/cron/intelligence/run
├ ƒ /api/cron/subscription-check
├ ƒ /api/cron/subscriptions
├ ƒ /api/debug/db-audit
├ ƒ /api/debug/me
├ ƒ /api/gym/[slug]
├ ƒ /api/gym/[slug]/join
├ ƒ /api/gym/[slug]/slots
├ ƒ /api/gym/resolve
├ ƒ /api/member/book-trainer
├ ƒ /api/member/bookings
├ ƒ /api/member/nutrition/food-log
├ ƒ /api/member/nutrition/meal-plans
├ ƒ /api/member/profile
├ ƒ /api/member/qr
├ ƒ /api/member/subscription
├ ƒ /api/messages
├ ƒ /api/notifications
├ ƒ /api/nutrition/food-log
├ ƒ /api/nutrition/meal-plans
├ ƒ /api/payments/initialize
├ ƒ /api/payments/verify
├ ƒ /api/payments/webhook
├ ƒ /api/plans
├ ƒ /api/plans/[planId]
├ ƒ /api/plans/bookings
├ ƒ /api/plans/bookings/[bookingId]
├ ƒ /api/public/branding
├ ƒ /api/superadmin/billing-stats
├ ƒ /api/superadmin/tenants
├ ƒ /api/superadmin/tenants/status
├ ƒ /api/superadmin/users
├ ƒ /api/temp-update
├ ƒ /api/tenant/create
├ ƒ /api/tenant/settings
├ ƒ /api/trainer/messages
├ ƒ /api/trainer/progress
├ ƒ /api/trainer/schedule
├ ƒ /api/trainer/workouts
├ ƒ /api/upload
├ ƒ /api/webhooks/paystack
├ ƒ /api/webhooks/platform-billing
├ ƒ /auth/signin
├ ○ /billing/blocked
├ ○ /blog
├ ○ /contact
├ ƒ /dashboard
├ ƒ /gym/[slug]
├ ƒ /gym/[slug]/blog
├ ƒ /gym/[slug]/blog/[postSlug]
├ ƒ /gym/[slug]/book
├ ƒ /gym/[slug]/checkout/[planId]
├ ƒ /gym/[slug]/dashboard/admin
├ ƒ /gym/[slug]/dashboard/admin/ai-usage
├ ƒ /gym/[slug]/dashboard/admin/attendance
├ ƒ /gym/[slug]/dashboard/admin/billing
├ ƒ /gym/[slug]/dashboard/admin/blog
├ ƒ /gym/[slug]/dashboard/admin/blog/[postId]
├ ƒ /gym/[slug]/dashboard/admin/blog/new
├ ƒ /gym/[slug]/dashboard/admin/bookings
├ ƒ /gym/[slug]/dashboard/admin/branding
├ ƒ /gym/[slug]/dashboard/admin/checkin
├ ƒ /gym/[slug]/dashboard/admin/domains
├ ƒ /gym/[slug]/dashboard/admin/entitlements-audit
├ ƒ /gym/[slug]/dashboard/admin/members
├ ƒ /gym/[slug]/dashboard/admin/memberships
├ ƒ /gym/[slug]/dashboard/admin/notifications
├ ƒ /gym/[slug]/dashboard/admin/plan-performance
├ ƒ /gym/[slug]/dashboard/admin/plans
├ ƒ /gym/[slug]/dashboard/admin/revenue
├ ƒ /gym/[slug]/dashboard/admin/trainers
├ ƒ /gym/[slug]/dashboard/admin/website
├ ƒ /gym/[slug]/dashboard/admin/website/branding
├ ƒ /gym/[slug]/dashboard/admin/website/content
├ ƒ /gym/[slug]/dashboard/admin/website/hero
├ ƒ /gym/[slug]/dashboard/admin/website/info
├ ƒ /gym/[slug]/dashboard/admin/website/social
├ ƒ /gym/[slug]/dashboard/member
├ ƒ /gym/[slug]/dashboard/member/ai
├ ƒ /gym/[slug]/dashboard/member/ai/chat
├ ƒ /gym/[slug]/dashboard/member/ai/nutrition
├ ƒ /gym/[slug]/dashboard/member/ai/progress
├ ƒ /gym/[slug]/dashboard/member/ai/workout
├ ƒ /gym/[slug]/dashboard/member/attendance
├ ƒ /gym/[slug]/dashboard/member/billing
├ ƒ /gym/[slug]/dashboard/member/book-trainer
├ ƒ /gym/[slug]/dashboard/member/bookings
├ ƒ /gym/[slug]/dashboard/member/community
├ ƒ /gym/[slug]/dashboard/member/community/challenges
├ ƒ /gym/[slug]/dashboard/member/community/leaderboard
├ ƒ /gym/[slug]/dashboard/member/messages
├ ƒ /gym/[slug]/dashboard/member/notifications
├ ƒ /gym/[slug]/dashboard/member/nutrition
├ ƒ /gym/[slug]/dashboard/member/nutrition/foods
├ ƒ /gym/[slug]/dashboard/member/nutrition/log
├ ƒ /gym/[slug]/dashboard/member/nutrition/plans
├ ƒ /gym/[slug]/dashboard/member/profile
├ ƒ /gym/[slug]/dashboard/member/progress
├ ƒ /gym/[slug]/dashboard/member/workouts
├ ƒ /gym/[slug]/dashboard/trainer
├ ƒ /gym/[slug]/dashboard/trainer/bookings
├ ƒ /gym/[slug]/dashboard/trainer/clients
├ ƒ /gym/[slug]/dashboard/trainer/messages
├ ƒ /gym/[slug]/dashboard/trainer/progress
├ ƒ /gym/[slug]/dashboard/trainer/schedule
├ ƒ /gym/[slug]/dashboard/trainer/workouts
├ ƒ /gym/[slug]/join
├ ƒ /gym/[slug]/onboarding
├ ƒ /onboarding
└ ○ /pricing


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

