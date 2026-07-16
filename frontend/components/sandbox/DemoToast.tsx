"use client";

import React from "react";
import toast from "react-hot-toast";
import { useSandbox } from "@/lib/sandbox/context";

export function triggerDemoToast() {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden border border-indigo-100 dark:border-indigo-900/50 relative`}
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
        <div className="p-5 flex-1">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <span className="text-2xl">🚧</span>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Demo Mode Active
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This sandbox is read-only. To manage your real members, track live payments, and deploy your custom portal, activate a live CortexFit account.
              </p>
              <div className="mt-4 flex">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Contact Team to Upgrade
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-800">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}

export function useDemoGuard() {
  const { isSandbox } = useSandbox();

  /**
   * Wraps an event handler or function. If in sandbox mode, it blocks execution
   * and shows the demo toast. Otherwise, it executes the original function.
   */
  const withDemoGuard = <T extends (...args: any[]) => any>(
    fn?: T
  ): ((...args: Parameters<T>) => void) => {
    return (...args: Parameters<T>) => {
      if (isSandbox) {
        // Prevent default if it's an event
        if (args[0] && typeof args[0].preventDefault === "function") {
          args[0].preventDefault();
        }
        triggerDemoToast();
        return;
      }
      if (fn) {
        return fn(...args);
      }
    };
  };

  return { withDemoGuard, isSandbox, triggerDemoToast };
}
