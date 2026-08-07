"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function UtmTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const utmSource = searchParams.get("utm_source");
    if (utmSource) {
      const utmData = {
        utm_source: utmSource,
        utm_medium: searchParams.get("utm_medium") || "",
        utm_campaign: searchParams.get("utm_campaign") || "",
        utm_term: searchParams.get("utm_term") || "",
        utm_content: searchParams.get("utm_content") || "",
        landing_page: window.location.pathname,
        referrer: document.referrer,
        first_visit_at: new Date().toISOString(),
      };

      // Store in a first-party cookie for 30 days (without HttpOnly so JS can read it)
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      
      document.cookie = `cortexfit_utm=${encodeURIComponent(
        JSON.stringify(utmData)
      )};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
