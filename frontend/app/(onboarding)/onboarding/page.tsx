"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, Building, CheckCircle2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a live slug preview
  const liveSlug = gymName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) {
      setError("Please enter a gym name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tenant/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: gymName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create gym workspace.");
      }

      // Success! Redirect to the new admin dashboard
      router.push(`/gym/${data.tenant.slug}/dashboard/admin`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25">
          <Building className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Set up your Gym
        </h1>
        <p className="text-gray-400">
          Enter your gym's name to generate your custom workspace URL.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <CheckCircle2 className={`w-5 h-5 mt-0.5 ${gymName.length > 0 ? "text-indigo-400" : "text-gray-600"}`} />
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
          disabled={isSubmitting || !gymName.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:from-indigo-500 hover:to-blue-500 focus:ring-4 focus:ring-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Workspace...
            </>
          ) : (
            <>
              Launch Workspace
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Already have a gym?{" "}
          <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
