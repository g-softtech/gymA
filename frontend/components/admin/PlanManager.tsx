"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MembershipPlan } from "@prisma/client";
import { EntitlementKeys, ENTITLEMENTS_REGISTRY } from "@/lib/entitlements/registry";
import { defaultEntitlements, type Entitlements } from "@/lib/entitlements/schema";

interface PlanManagerProps {
  tenantId: string;
  slug: string;
  initialPlans: MembershipPlan[];
}

export default function PlanManager({ tenantId, slug, initialPlans }: PlanManagerProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ 
    name: "", 
    price: "", 
    durationDays: "",
    entitlements: { ...defaultEntitlements } as Entitlements,
  });

  const handleCreate = async () => {
    setError("");
    if (!form.name || !form.price || !form.durationDays) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: form.name,
          price: parseFloat(form.price),
          durationDays: parseInt(form.durationDays),
          entitlements: form.entitlements,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create plan.");
      } else {
        const newPlan = await res.json();
        setPlans((prev) => [...prev, newPlan]);
        setForm({ 
          name: "", 
          price: "", 
          durationDays: "",
          entitlements: { ...defaultEntitlements } as Entitlements,
        });
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Delete this plan? Members with active subscriptions won't be affected.")) return;
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== planId));
        router.refresh();
      }
    } catch {
      setError("Failed to delete plan.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Create New Plan</h2>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{error}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plan Name</label>
            <input
              type="text"
              placeholder="e.g. Monthly Basic"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Price (₦)</label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
            <input
              type="number"
              placeholder="e.g. 30"
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Features & Limits</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            {Object.entries(ENTITLEMENTS_REGISTRY).map(([key, config]) => {
              const typedKey = key as keyof Entitlements;
              return (
                <div key={key} className="flex flex-col">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {config.label}
                  </label>
                  {config.type === "boolean" ? (
                    <select
                      value={form.entitlements[typedKey] ? "true" : "false"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          entitlements: {
                            ...form.entitlements,
                            [key]: e.target.value === "true",
                          },
                        })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={form.entitlements[typedKey] as number}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          entitlements: {
                            ...form.entitlements,
                            [key]: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{config.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
        >
          {loading ? "Creating..." : "Create Plan"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Existing Plans</h2>
        </div>
        {plans.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-400">No plans yet. Create one above.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {plans.map((plan) => (
              <div key={plan.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-sm text-gray-500">{plan.durationDays} days access</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-gray-900">₦{plan.price.toLocaleString()}</p>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-sm text-red-500 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
