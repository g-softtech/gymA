"use client";

import { useState, useEffect } from "react";
import { useBranding } from "@/components/TenantThemeProvider";

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
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/billing/status");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch status");
      setStatus(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
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

  const plans = [
    {
      name: "FREE",
      price: "₦0",
      description: "Basic gym management",
      features: ["Up to 50 members", "Basic analytics", "Standard support"],
      isCurrent: status?.subscriptionPlan === "FREE",
      priceId: null,
    },
    {
      name: "PRO",
      price: "₦49,000/mo",
      description: "For growing gyms",
      features: ["Custom Domain", "Up to 500 members", "Basic branding"],
      isCurrent: status?.subscriptionPlan === "PRO",
      priceId: "PRO_PRICE_ID", // Will be mapped securely on backend or we pass the alias and backend resolves. 
      // Wait, the API expects priceId. The user said: "Do NOT assume Stripe products exist — use environment variables for Price IDs."
      // Since client doesn't know env variables unless they are NEXT_PUBLIC_, I will pass the plan alias ("PRO") to the API instead! 
    },
    {
      name: "ENTERPRISE",
      price: "₦199,000/mo",
      description: "Full white-label SaaS experience",
      features: ["White-Label Mode", "Unlimited members", "Multiple Domains"],
      isCurrent: status?.subscriptionPlan === "ENTERPRISE",
      priceId: "ENTERPRISE_PRICE_ID",
    },
  ];

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading billing state...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Subscription</h1>
        <p className="mt-2 text-gray-600">Manage your subscription, plan limits, and billing history.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Current Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Current Plan</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-black text-gray-900">{status?.subscriptionPlan || "FREE"}</h2>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${status?.subscriptionStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {status?.subscriptionStatus === "active" ? "ACTIVE" : (status?.subscriptionStatus || "INACTIVE").toUpperCase()}
              </span>
            </div>
            {status?.currentPeriodEnd && (
              <p className="text-sm text-gray-500 mt-2">
                Renews on: {new Date(status.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {status?.subscriptionPlan !== "FREE" && (
            <button
              disabled
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium cursor-not-allowed"
              title="Coming soon: Manage via Stripe Customer Portal"
            >
              Manage Subscription
            </button>
          )}
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={`bg-white rounded-3xl p-8 border-2 transition-all ${plan.isCurrent ? "border-indigo-600 shadow-xl shadow-indigo-100" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}
          >
            {plan.isCurrent && (
              <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-4">
                CURRENT PLAN
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900">{plan.price}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 h-10">{plan.description}</p>
            
            <ul className="mt-6 space-y-4">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {plan.isCurrent ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
                  Current Plan
                </button>
              ) : plan.name === "FREE" ? (
                <button disabled className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-400 font-bold text-sm cursor-not-allowed">
                  Downgrade Support Coming Soon
                </button>
              ) : (
                <button 
                  onClick={() => handleUpgrade(plan.name, plan.name)}
                  disabled={!!checkoutLoading}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                  style={{ background: primaryColor || "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                >
                  {checkoutLoading === plan.name ? "Redirecting..." : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
