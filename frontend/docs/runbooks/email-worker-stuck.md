# Runbook: Email Worker Stuck

**Incident:** Transactional emails (Welcome emails, Magic Links) are taking longer than 5 minutes to arrive, or not arriving at all.

## 1. Verify Queue Depth
1. Check the Super Admin operations dashboard.
2. If the `Email Queue Depth` is increasing rapidly and processing is `0`, the worker has stalled.

## 2. Check Worker Logs
1. Open Vercel Logs.
2. Filter for the background worker or cron job executing the email queue (`/api/cron/process-emails`).
3. Look for errors related to the Resend API rate limits (`429 Too Many Requests`) or API Key invalidation (`401 Unauthorized`).

## 3. Mitigation
- If the Resend API key is invalid, update `RESEND_API_KEY` in the Vercel Environment Variables and redeploy/restart.
- If we hit a rate limit, the queue is designed to safely pause. No emails are lost. Wait for the rate limit window to reset.
- To forcefully trigger the queue to drain, manually hit the cron endpoint: `curl -X POST https://fit.thecortexsystems.com/api/cron/process-emails -H "Authorization: Bearer <CRON_SECRET>"`
