# Runbook: Billing Failure

**Incident:** A tenant's subscription payment has failed, or webhooks are failing to sync with the database.

## 1. Verify Webhook Delivery
1. Log into the Stripe/Paystack dashboard.
2. Navigate to Developers > Webhooks.
3. Check for `invoice.payment_failed` or `charge.failed` events.
4. Verify if the webhook endpoint returned a `200 OK` or a `500 Error`.

## 2. Check Application Logs
1. Open Vercel Logs.
2. Filter by path `/api/webhooks/paystack` or `/api/webhooks/stripe`.
3. Look for "Webhook Signature Verification Failed" or Prisma database errors.

## 3. Mitigation
- If the payment failed due to NSF (Insufficient Funds), the system will automatically retry based on the payment gateway's dunning settings.
- If the webhook failed to process, replay the webhook from the payment gateway dashboard.
- If the tenant's access is incorrectly restricted, use the Super Admin dashboard to manually force a billing sync: `POST /api/admin/billing/sync?tenantId=<id>`
