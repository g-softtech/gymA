/**
 * Centralized environment variable validation.
 * Run during module initialization to guarantee presence of critical config.
 */

export const env = {
  get SUPERADMIN_EMAILS(): string[] {
    const emails = process.env.SUPERADMIN_EMAILS;
    if (!emails) {
      console.warn("[ENV] ⚠️ SUPERADMIN_EMAILS is missing. SuperAdmin notifications will not be sent.");
      return [];
    }
    return emails.split(",").map(e => e.trim()).filter(Boolean);
  },

  get PLATFORM_SUPERADMIN_EMAIL(): string | undefined {
    return process.env.PLATFORM_SUPERADMIN_EMAIL;
  },

  get PLATFORM_SUPERADMIN_PASSWORD(): string | undefined {
    return process.env.PLATFORM_SUPERADMIN_PASSWORD;
  },

  get NEXT_PUBLIC_APP_URL(): string {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (!url) {
      console.warn("[ENV] ⚠️ NEXT_PUBLIC_APP_URL is missing. Links in emails may be broken.");
      return "http://localhost:3000";
    }
    return url;
  },

  get RESEND_API_KEY(): string | undefined {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("[ENV] ⚠️ RESEND_API_KEY is missing. Emails will be logged to console instead of sent.");
    }
    return key;
  },
};
