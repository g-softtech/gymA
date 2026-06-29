"use client";

import { useState, useEffect } from "react";
import { useBranding } from "@/components/TenantThemeProvider";
import type { PlatformPlanConfig } from "@/lib/billing/pricingConfig";

type PlanInfo = {
  subscriptionPlan: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
};

export default function BillingManagerClient() {
  const { primaryColor } = useBranding();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<PlanInfo | null>(null);
  const [plans, setPlans] = useState<PlatformPlanConfig[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchStatus(), fetchPlans()]).finally(() => setLoading(false));
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/billing/status");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch status");
      setStatus(json.data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/billing/plans");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch plans");
      setPlans(json.data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpgrade = async (planAlias: string, planName: string) => {
    setCheckoutLoading(planName);
    setError("");

    try {
      const res = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: planAlias }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to initialize payment");

      if (json.authorization_url) {
        window.location.href = json.authorization_url;
      }
    } catch (e: any) {
      setError(e.message);
      setCheckoutLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading billing state...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Subscription</h1>
        <p className="mt-2 text-muted-foreground">Manage your subscription, plan limits, and billing history.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Current Status Card */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-black text-foreground">{status?.subscriptionPlan || "FREE"}</h2>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${status?.subscriptionStatus === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {status?.subscriptionStatus === "active" ? "ACTIVE" : (status?.subscriptionStatus || "INACTIVE").toUpperCase()}
              </span>
            </div>
            {status?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground mt-2">
                Renews on: {new Date(status.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {status?.subscriptionPlan !== "FREE" && (
            <button
              disabled
              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed"
              title="Coming soon: Manage via Stripe Customer Portal"
            >
              Manage Subscription
            </button>
          )}
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = status?.subscriptionPlan === plan.code;
          return (
          <div 
            key={plan.code} 
            className={`bg-card text-card-foreground rounded-3xl p-8 border-2 transition-all ${isCurrent ? "border-indigo-600 shadow-xl shadow-indigo-100" : "border-border hover:border-border shadow-sm"}`}
          >
            {isCurrent && (
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4">
                CURRENT PLAN
              </div>
            )}
            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground">
                {plan.amountNGN === 0 ? "Free" : `₦${plan.amountNGN.toLocaleString()}`}
              </span>
              <span className="text-sm text-muted-foreground">/{plan.interval}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground h-10">{plan.description}</p>
            
            <ul className="mt-6 space-y-4">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {isCurrent ? (
                <button disabled className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed">
                  Current Plan
                </button>
              ) : plan.code === "FREE" ? (
                <button disabled className="w-full py-3 rounded-xl border-2 border-border text-muted-foreground font-bold text-sm cursor-not-allowed">
                  Downgrade Support Coming Soon
                </button>
              ) : (
                <button 
                  onClick={() => handleUpgrade(plan.code, plan.name)}
                  disabled={!!checkoutLoading}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                  style={{ background: primaryColor || "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                >
                  {checkoutLoading === plan.name ? "Redirecting..." : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
