"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// Icons replaced with emojis

interface PlanPerformanceData {
  planId: string;
  planName: string;
  activeMembers: number;
  revenue: number;
  blockedRequests: number;
}

export default function PlanPerformancePage() {
  const [data, setData] = useState<PlanPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/plan-performance");
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch plan performance", err);
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
          <span className="text-2xl">📋</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan Performance Dashboard</h1>
          <p className="text-muted-foreground">Analyze how your membership plans are performing in revenue and restrictions.</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Plan Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center">
                    <span className="mr-1">👥</span>
                    Active Members
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center">
                    <span className="mr-1">📈</span>
                    MRR (Revenue)
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center">
                    <span className="mr-1">🚨</span>
                    Blocked Requests
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card text-card-foreground divide-y divide-border">
              {data.map((plan) => (
                <tr key={plan.planId} className="hover:bg-muted transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{plan.planName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground font-semibold">{plan.activeMembers}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      ₦{plan.revenue.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-bold ${plan.blockedRequests > 10 ? 'text-rose-600' : 'text-foreground'}`}>
                        {plan.blockedRequests}
                      </span>
                      {plan.blockedRequests > 50 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                          Highly Restrictive
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No active membership plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
