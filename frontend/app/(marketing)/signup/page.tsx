"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export default function SignupPage() {
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [gymName, setGymName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate a live slug preview
  const liveSlug = gymName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !email.trim() || !gymName.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create the PendingSignup record
      const res = await fetch("/api/signup/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName, email, gymName, slug: liveSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate signup.");
      }

      // Track the signup initiation
      trackEvent(ANALYTICS_EVENTS.SIGNUP_INITIATED, {
        gymName,
      });

      // 2. Trigger NextAuth Magic Link via EmailProvider
      // We set the callbackUrl to /onboarding/process so we can provision the gym AFTER they verify their email
      const signInRes = await signIn("email", { 
        email, 
        redirect: false,
        callbackUrl: "/onboarding/process" 
      });

      if (signInRes?.error) {
        throw new Error(signInRes.error);
      }

      // 3. Show success screen
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-card backdrop-blur-xl border border-border rounded-3xl p-8 md:p-12 shadow-2xl max-w-lg mx-auto mt-24 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
          <span className="text-4xl text-white">✉️</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-4">
          Check your email!
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          We've sent a secure login link to <span className="font-semibold text-foreground">{email}</span>. 
          <br/><br/>
          Click the link in the email to instantly verify your account and finish setting up <strong>{gymName}</strong>!
        </p>
        <p className="text-sm text-muted-foreground">
          Didn't receive it? <button onClick={() => setSuccess(false)} className="text-indigo-400 hover:underline">Try again</button>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl max-w-xl mx-auto mt-16 mb-24">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25">
          <span className="text-3xl">🏢</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Create your Gym
        </h1>
        <p className="text-gray-400">
          Enter your details below to launch your workspace. No credit card required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
            Your Full Name
          </label>
          <input
            id="ownerName"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="John Doe"
            disabled={isSubmitting}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            disabled={isSubmitting}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="gymName" className="block text-sm font-medium text-gray-300 mb-2">
            Gym or Studio Name
          </label>
          <input
            id="gymName"
            type="text"
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            placeholder="e.g. IronHouse Fitness"
            disabled={isSubmitting}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Live Preview Box */}
        <div className={`rounded-xl p-4 transition-all duration-300 ${gymName.length > 0 ? "bg-white/5 border border-indigo-500/30" : "bg-white/5 border border-white/5 opacity-50"}`}>
          <div className="flex items-start gap-3">
            <span className={`text-xl ${gymName.length > 0 ? "opacity-100" : "opacity-30"}`}>✅</span>
            <div>
              <p className="text-sm font-medium text-gray-300">Your Workspace URL</p>
              <p className="text-sm font-mono text-indigo-300 mt-1 break-all">
                cortexfit.com/gym/<span className="font-bold text-white">{liveSlug || "your-gym"}</span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !ownerName.trim() || !email.trim() || !gymName.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:from-indigo-500 hover:to-blue-500 focus:ring-4 focus:ring-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? "⏳ Preparing Workspace..." : "Create Workspace 🚀"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
