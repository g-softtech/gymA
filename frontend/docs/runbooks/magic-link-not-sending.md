# Runbook: Magic Link Not Sending

**Incident:** Users are attempting to log in or sign up, but are not receiving the magic link email.

## 1. Verify Queue Processing
1. Since Magic Links are critical, they bypass the standard slow email queue and should be sent immediately or prioritized.
2. Check Vercel logs for the `/api/auth/signin` endpoint to ensure the token generation and dispatch did not throw an error.

## 2. Verify Email Provider (Resend)
1. Log into the Resend dashboard.
2. Check the **Logs** section to see if the email was Accepted, Delivered, or Bounced.
3. If the email bounced, the user's email server is rejecting it (often due to aggressive spam filters).
4. If Resend shows the email as Delivered, advise the user to check their Spam/Junk folder and whitelist `no-reply@cortexsystems.com`.

## 3. Mitigation
- If Resend API is down (Status: 500 from Resend), we must wait for their service to restore. Inform users via a banner on the login page.
- For emergency access to a specific tenant (e.g., Gym Owner locked out), Super Admins can manually generate an active session token or bypass link via the operations dashboard.
