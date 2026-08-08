"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/index";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBED, { source: "marketing_blog" });

      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-indigo-700/50 backdrop-blur-sm border border-indigo-500/50 rounded-2xl p-8 text-center shadow-lg transform transition-all duration-500 scale-100 opacity-100 max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-400/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
        <p className="text-indigo-100">
          Thanks for subscribing. Check your inbox for a welcome email.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-indigo-300 hover:text-white transition-colors"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <div className="relative group max-w-md mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
      <div className="relative bg-indigo-900/40 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-1">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            placeholder="your@email.com"
            required
            aria-label="Email address"
            className="flex-1 px-5 py-4 rounded-xl bg-white/10 text-white placeholder-indigo-300 text-sm border-transparent focus:bg-white/20 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading" || !email}
            className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all text-sm shrink-0 flex items-center justify-center min-w-[140px] disabled:opacity-70 disabled:active:scale-100 shadow-sm"
          >
            {status === "loading" ? (
              <svg className="animate-spin h-5 w-5 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      </div>
      
      {/* Error Message */}
      {status === "error" && (
        <div className="absolute top-full left-0 right-0 mt-3 flex items-center justify-center gap-2 text-red-300 text-sm bg-red-900/30 py-2 px-4 rounded-lg border border-red-500/30 backdrop-blur-sm animate-fade-in-up">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
