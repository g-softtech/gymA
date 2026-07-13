"use client";

import { useState, useEffect } from "react";
import { useBranding } from "@/components/TenantThemeProvider";
import type { PlatformPlanConfig } from "@/lib/billing/pricing.config";
import { PricingCard } from "@/components/billing/PricingCard";

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
      // In a real app, this API endpoint would be updated to return planCatalogService.getPlans()
      const res = await fetch("/api/billing/plans");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch plans");
      setPlans(json.data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    setCheckoutLoading(planCode);
    setError("");

    try {
      const res = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
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
    <div className="max-w-7xl mx-auto space-y-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-6 items-start">
        {plans.map((plan) => {
          const isCurrent = status?.subscriptionPlan === plan.code;
          const currentPlanConfig = plans.find(p => p.code === (status?.subscriptionPlan || "STARTER")) || plans[0];
          const isDowngrade = plan.pricing?.[0]?.amountSubunits < currentPlanConfig?.pricing?.[0]?.amountSubunits;

          return (
            <PricingCard 
              key={plan.code} 
              plan={plan} 
              renderAction={(p) => {
                if (isCurrent) {
                  return (
                    <button 
                      onClick={() => handleUpgrade(p.code)}
                      disabled={!!checkoutLoading}
                      className="w-full py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold text-sm transition-all"
                    >
                      {checkoutLoading === p.code ? "Redirecting..." : `Renew ${p.ui?.displayName}`}
                    </button>
                  );
                }
                
                if (isDowngrade) {
                  return (
                    <button disabled className="w-full py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed">
                      Contact support to downgrade
                    </button>
                  );
                }

                return (
                  <button 
                    onClick={() => handleUpgrade(p.code)}
                    disabled={!!checkoutLoading}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                    style={{ background: primaryColor || "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                  >
                    {checkoutLoading === p.code ? "Redirecting..." : `Upgrade to ${p.ui?.displayName}`}
                  </button>
                );
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
