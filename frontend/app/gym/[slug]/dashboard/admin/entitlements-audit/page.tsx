"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// Icons replaced with emojis

interface EntitlementAuditData {
  id: string;
  name: string;
  entitlements: any;
  subscribers: number;
  usageThisMonth: number;
  membersAtLimit: number;
  blockedRequests: number;
  lastTrigger?: {
    feature: string;
    allowed: boolean;
    createdAt: string;
    reason: string | null;
  };
}

export default function EntitlementsAuditPage() {
  const params = useParams();
  const [data, setData] = useState<EntitlementAuditData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/entitlements/audit");
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch audit data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <span className="text-2xl">🛡️</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entitlements Audit</h1>
          <p className="text-gray-500">Monitor limits, blocked requests, and engine telemetry across plans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {plan.subscribers} Subscribers
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x border-b border-gray-200">
              <div className="p-6">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
                  <span className="mr-2">📊</span>
                  Usage This Month
                </div>
                <div className="text-3xl font-bold text-gray-900">{plan.usageThisMonth}</div>
                <div className="text-sm text-gray-500 mt-1">Total engine evaluations</div>
              </div>

              <div className="p-6">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
                  <span className="mr-2">⚠️</span>
                  Members at Limit
                </div>
                <div className="text-3xl font-bold text-gray-900">{plan.membersAtLimit}</div>
                <div className="text-sm text-gray-500 mt-1">Distinct users blocked</div>
              </div>

              <div className="p-6">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
                  <span className="mr-2">🚨</span>
                  Blocked Requests
                </div>
                <div className="text-3xl font-bold text-gray-900">{plan.blockedRequests}</div>
                <div className="text-sm text-gray-500 mt-1">Rejected entitlement requests</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Entitlements Configuration</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(plan.entitlements, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Last Enforcement Trigger</h3>
                {plan.lastTrigger ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {plan.lastTrigger.feature}
                      </span>
                      {plan.lastTrigger.allowed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{plan.lastTrigger.reason || "No reason recorded"}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(plan.lastTrigger.createdAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center h-full text-gray-400 py-8">
                    <span className="text-3xl mb-2 opacity-50">✅</span>
                    <span className="text-sm">No telemetry recorded yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <span className="text-5xl mx-auto mb-4 opacity-50 block">👥</span>
            <h3 className="text-lg font-medium text-gray-900">No Plans Found</h3>
            <p className="text-gray-500 mt-2">Create membership plans to see entitlement telemetry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
