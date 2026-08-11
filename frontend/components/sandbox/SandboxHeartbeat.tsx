"use client";

import { useEffect, useRef } from "react";

export function SandboxHeartbeat() {
  const lastPingRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pingHeartbeat = async (isBeacon = false) => {
      // Don't ping if page is hidden, unless it's a beacon (page unloading)
      if (document.visibilityState === "hidden" && !isBeacon) {
        return;
      }

      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastPingRef.current) / 1000);
      
      // Cap at 60s max increment (to prevent background tab runaway)
      const cappedDelta = Math.min(deltaSeconds, 60);

      if (cappedDelta <= 0 && !isBeacon) return;

      try {
        if (isBeacon && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ deltaSeconds: cappedDelta })], { type: "application/json" });
          navigator.sendBeacon("/api/sandbox/heartbeat", blob);
        } else {
          await fetch("/api/sandbox/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deltaSeconds: cappedDelta })
          });
        }
        
        lastPingRef.current = Date.now();
      } catch (err) {
        // Ignore errors
      }
    };

    // Ping every 30 seconds
    const interval = setInterval(() => pingHeartbeat(false), 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pingHeartbeat(true);
      } else {
        // Reset timer when coming back to visible
        lastPingRef.current = Date.now();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", () => pingHeartbeat(true));

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", () => pingHeartbeat(true));
    };
  }, []);

  return null;
}
