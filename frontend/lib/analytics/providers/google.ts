import { AnalyticsEvent } from "../events";
import { EventPayload } from "../index";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackGoogleEvent(event: AnalyticsEvent | string, params?: EventPayload) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}
