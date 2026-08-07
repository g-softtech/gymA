import { AnalyticsEvent } from "./events";
import { trackGoogleEvent } from "./providers/google";
import { trackClarityEvent } from "./providers/clarity";

/**
 * Common payload expected for tenant-specific analytics.
 * Never pass PII (emails, names, phone numbers) into this tracking function.
 */
export interface EventPayload extends Record<string, unknown> {
  tenant_slug?: string;
  tenant_plan?: string;
  source?: string;
}

/**
 * Centralized wrapper for triggering analytics events.
 * Broadcasts to all configured analytics providers seamlessly.
 * 
 * @param event The standardized event name from ANALYTICS_EVENTS
 * @param params Optional metadata about the event (excluding PII)
 */
export function trackEvent(event: AnalyticsEvent | string, params?: EventPayload) {
  if (typeof window === "undefined") return;

  // Retrieve UTMs from our first-party cookie if available
  let utmParams = {};
  try {
    const cookies = document.cookie.split(';');
    const utmCookie = cookies.find(c => c.trim().startsWith('cortexfit_utm='));
    if (utmCookie) {
      utmParams = JSON.parse(decodeURIComponent(utmCookie.split('=')[1]));
    }
  } catch (e) {
    // Silently fail if cookie parsing fails
  }

  const enrichedParams = { ...utmParams, ...params };

  // 1. Google Analytics 4
  trackGoogleEvent(event, enrichedParams);

  // 2. Microsoft Clarity
  trackClarityEvent(event, enrichedParams);

  // Debug mode for local development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] Tracked Event: ${event}`, enrichedParams);
  }
}
