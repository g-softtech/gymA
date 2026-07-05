# Disaster Recovery Runbook: Platform Billing

## 1. Point-in-Time Recovery (PITR)
Neon serverless Postgres automatically retains point-in-time recovery data.
If the `Tenant` or `Subscription` state is globally corrupted by an errant script or bug:
1. Log into the Neon Console.
2. Select the `ep-weathered-credit-aqlu1kv0` database branch.
3. Click **Restore to point in time**.
4. Select the timestamp immediately preceding the corruption event.
5. Create a new branch for the restored state and verify its integrity.
6. Swap the connection string in Vercel to point to the restored branch.

## 2. Event Replay Recovery (Billing State Reconstruction)
If the database is restored to an older snapshot, billing states (e.g. renewals that happened *after* the snapshot) will be lost.
We can reconstruct this state using our webhook replay mechanism.
1. Run `npx tsx scripts/billing-disaster-recovery.ts` locally or in an isolated environment to verify that Paystack webhooks safely reconstruct state using the `idempotency` rules in `BillingEvent`.
2. Extract the lost webhooks from the Paystack Dashboard (under **Logs > Webhooks**) that occurred between the snapshot time and current time.
3. Use an isolated script to `POST` these webhooks directly to the `/api/webhooks/platform-billing` endpoint with the correct `x-paystack-signature`.
4. The idempotent event architecture will automatically reconstruct the `billingStatus` and `billingEndsAt` for all tenants.

## 3. Manual Database Backups
In addition to Neon PITR, logical dumps should be taken periodically:
`pg_dump -Fc $DATABASE_URL > backup.dump`

To restore:
`pg_restore -d $RESTORE_URL backup.dump`
