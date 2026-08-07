# Runbook: Paystack Webhook Failure

**Incident:** Paystack is processing payments successfully, but CortexFit is not granting access (the local database is not updating).

## 1. Verify Vercel Logs
1. Open Vercel Logs and filter for `/api/webhooks/paystack`.
2. Determine the failure mode:
   - **401 Unauthorized:** The `PAYSTACK_SECRET_KEY` is missing or invalid, causing signature verification to fail.
   - **500 Internal Server Error:** A database write failed when applying the entitlement.

## 2. Check Paystack Dashboard
1. Log into the Paystack Dashboard.
2. Go to Settings > Webhooks.
3. Check the failure rate. If webhooks are failing consistently, Paystack may disable the endpoint.
4. Manually click "Re-fire Webhook" on the failed events once the root cause is resolved.

## 3. Mitigation
- If the issue was a bad API key, update the environment variable in Vercel.
- If webhooks cannot be recovered, manually sync the affected tenant's billing state using the Super Admin Operations dashboard: `POST /api/admin/billing/sync?tenantId=<id>`.
