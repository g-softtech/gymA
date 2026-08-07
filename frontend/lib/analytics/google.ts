import { AnalyticsEvent } from "./events";

// Extend the Window interface to recognize the gtag function injected by @next/third-parties
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

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
 * Currently broadcasts to Google Analytics (GA4), but easily extensible to Mixpanel, PostHog, Meta, etc.
 * 
 * @param event The standardized event name from ANALYTICS_EVENTS
 * @param params Optional metadata about the event (excluding PII)
 */
export function trackEvent(event: AnalyticsEvent | string, params?: EventPayload) {
  if (typeof window === "undefined") return;

  // 1. Google Analytics 4 (GA4)
  if (window.gtag) {
    window.gtag("event", event, params);
  }

  // 2. Future Integrations (Mixpanel, PostHog, Meta Pixel) can be added here
  // if (window.mixpanel) window.mixpanel.track(event, params);
  
  // Debug mode for local development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] Tracked Event: ${event}`, params || {});
  }
}
