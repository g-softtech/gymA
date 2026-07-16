"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Link from "next/link";

interface DemoSandboxContextType {
  isDemoModalOpen: boolean;
  triggerDemoModal: () => void;
  closeDemoModal: () => void;
}

const DemoSandboxContext = createContext<DemoSandboxContextType | undefined>(undefined);

export function DemoSandboxProvider({ children }: { children: ReactNode }) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const triggerDemoModal = () => setIsDemoModalOpen(true);
  const closeDemoModal = () => setIsDemoModalOpen(false);

  useEffect(() => {
    const handleEvent = () => triggerDemoModal();
    window.addEventListener("demo-mode-active", handleEvent);

    // Global Fetch Interceptor to catch DEMO_MODE_ACTIVE from any Server Action or API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      // Clone so we don't consume the original response body before the caller gets it
      const clone = response.clone();
      try {
        const data = await clone.json();
        if (data?.error === "DEMO_MODE_ACTIVE" || data?.message === "DEMO_MODE_ACTIVE") {
          window.dispatchEvent(new CustomEvent("demo-mode-active"));
          // Return a pending promise so the UI doesn't crash from an unhandled rejection,
          // or reject softly. We reject so that loaders stop spinning.
          return Promise.reject(new Error("DEMO_MODE_ACTIVE"));
        }
      } catch (err) {
        // Not JSON, ignore
      }
      return response;
    };

    return () => {
      window.removeEventListener("demo-mode-active", handleEvent);
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <DemoSandboxContext.Provider value={{ isDemoModalOpen, triggerDemoModal, closeDemoModal }}>
      {children}
      {isDemoModalOpen && <DemoUpgradeModal onClose={closeDemoModal} />}
    </DemoSandboxContext.Provider>
  );
}

export function useDemoSandbox() {
  const context = useContext(DemoSandboxContext);
  if (!context) {
    throw new Error("useDemoSandbox must be used within a DemoSandboxProvider");
  }
  return context;
}

/**
 * A highly-polished, premium overlay modal displayed when a user
 * attempts to execute a write action in Demo Mode.
 */
function DemoUpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-6">
            <span className="text-3xl">✨</span>
          </div>
          
          <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-2">
            Demo Workspace Active
          </h2>
          
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            This is a live, read-only preview of Eco Fitness Hub. To manage real members, track live payments, and deploy your own custom portal, activate an active CortexFit account.
          </p>
          
          <div className="space-y-3">
            <a
              href="https://wa.me/2348000000000" // Replace with actual WhatsApp/Scheduling link
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              Schedule 10-Min Onboarding Call
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
