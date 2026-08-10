"use client";

import { useEffect, useRef } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

interface GuidedTourProps {
  isSandbox: boolean;
  role: string;
  tenantSlug: string;
}

export default function GuidedTour({ isSandbox, role, tenantSlug }: GuidedTourProps) {
  const isStarted = useRef(false);

  useEffect(() => {
    // Only run for ADMINs in the sandbox
    if (!isSandbox || (role !== "ADMIN" && role !== "SUPERADMIN")) {
      return;
    }

    const storageKey = `cortexfit:guided-tour:v1:${tenantSlug}:admin`;

    const startTour = (force = false) => {
      if (!force) {
        const hasCompleted = localStorage.getItem(storageKey);
        if (hasCompleted) return;
      }

      if (isStarted.current) return;
      isStarted.current = true;

      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: "Finish",
        nextBtnText: "Next &rarr;",
        prevBtnText: "&larr; Prev",
        onDestroyed: () => {
          localStorage.setItem(storageKey, "true");
          isStarted.current = false;
        },
        steps: ([
          {
            popover: {
              title: "Welcome to CortexFit",
              description: "Let's take a quick 3-step tour of the most powerful tools in your dashboard.",
              side: "over",
              align: "center",
            },
          },
          {
            element: "#tour-members",
            popover: {
              title: "Lightning-Fast Onboarding",
              description: "Add a new member and get them on a plan in under 10 seconds. You can manage everything about them here.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#tour-checkin-desk",
            popover: {
              title: "Modern Access Control",
              description: "Use the Check-in Desk to scan member QR codes, instantly verify active subscriptions, and log their attendance.",
              side: "right",
              align: "start",
            },
          },
          {
            element: "#tour-revenue-stats",
            popover: {
              title: "Automated Payment Recovery",
              description: "CortexFit automatically chases down failed payments for you. Monitor your real-time revenue and active subscriptions here.",
              side: "bottom",
              align: "center",
            },
          }
        ] as DriveStep[]).filter(step => {
          // Graceful degradation: skip steps if the DOM element doesn't exist yet
          if (step.element) {
            return document.querySelector(step.element as string) !== null;
          }
          return true;
        }),
      });

      driverObj.drive();
    };

    // Listen for manual triggers (from the Help button)
    const handleStartTour = () => startTour(true);
    window.addEventListener("cortexfit:start-tour", handleStartTour);

    // Wait until the DOM targets exist (or timeout after 5 seconds)
    const checkTargets = setInterval(() => {
      const allTargetsExist = !!(
        document.querySelector("#tour-members") &&
        document.querySelector("#tour-checkin-desk") &&
        document.querySelector("#tour-revenue-stats")
      );

      if (allTargetsExist) {
        clearInterval(checkTargets);
        // Add a tiny delay so the UI fully settles before starting
        setTimeout(() => startTour(false), 500);
      }
    }, 500);

    // Cleanup interval after 5 seconds to avoid infinite checking if elements never render
    const timeout = setTimeout(() => {
      clearInterval(checkTargets);
      // Try one last time with whatever exists
      startTour(false); 
    }, 5000);

    return () => {
      window.removeEventListener("cortexfit:start-tour", handleStartTour);
      clearInterval(checkTargets);
      clearTimeout(timeout);
    };
  }, [isSandbox, role, tenantSlug]);

  return null; // This component doesn't render any DOM of its own
}
