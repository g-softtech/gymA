import { AnalyticsEvent } from "../events";
import { EventPayload } from "../index";

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export function trackClarityEvent(event: AnalyticsEvent | string, params?: EventPayload) {
  if (typeof window === "undefined" || !window.clarity) return;
  // Clarity's custom tag API doesn't accept complex objects directly like GA4,
  // but you can push strings or key-value pairs.
  // For deep funnel events, we just log the event name.
  window.clarity("set", event, "true");
}
