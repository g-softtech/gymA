# Runbook: Failed Deployment

**Incident:** A deployment to Vercel fails during the build phase, or a successful deployment causes a critical production outage (P0).

## 1. Vercel Build Failures
1. Open the Vercel Dashboard -> CortexFit Project -> Deployments.
2. Inspect the build logs for the failed deployment.
3. Common causes:
   - **TypeScript Errors:** A type check failed. Run `npm run typecheck` locally to reproduce and fix.
   - **ESLint Errors:** A linting rule was broken. Run `npm run lint` locally.
   - **Prisma Generate Failure:** Ensure the `DATABASE_URL` is correct in the Vercel environment variables.

## 2. Production Outage (Instant Rollback)
If a deployment succeeds but crashes the production application (e.g., White Screen of Death, 500 errors on all API routes):
1. Immediately log into Vercel.
2. Go to Deployments.
3. Find the previous known-good deployment (look for the previous "Ready" state).
4. Click the three dots (...) next to it and select **Promote to Production** or **Instant Rollback**.
5. Once traffic is safely routed to the old version, investigate the bad commit locally.

## 3. Database Migration Desync
If the deployment failed because a Prisma migration could not be applied:
1. Do NOT rollback the Vercel deployment if the database schema was partially mutated.
2. Connect to the Neon database directly.
3. Determine if the migration needs to be rolled back manually via SQL, or if the code needs a hotfix to match the new schema state.
