"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UpgradeOpportunity {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  currentPlanId: string;
  currentPlanName: string;
  recommendedPlanId: string | null;
  recommendedPlanName: string | null;
  revenueUpside: number;
  blockedFeatures: string[];
}

export default function UpgradeIntelligenceClient() {
  const [data, setData] = useState<{
    candidatesDetails: UpgradeOpportunity[];
    potentialRevenue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics/upgrades");
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch upgrade intelligence", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return null; // Fail silently, it's an enhancement
  if (!data || !data.candidatesDetails || data.candidatesDetails.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 text-xl">💡</div>
          <div>
            <h3 className="text-lg font-bold text-indigo-900">Sales Opportunities</h3>
            <p className="text-sm text-indigo-700">Members hitting limits who are ready to upgrade.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Potential Pipeline</p>
          <p className="text-2xl font-black text-indigo-900">₦{data.potentialRevenue.toLocaleString()}/mo</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg border border-indigo-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-indigo-50">
            <thead className="bg-indigo-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase">Current Plan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase">Blocked Trying To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-800 uppercase">Recommended Plan</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-indigo-800 uppercase">Upside</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {data.candidatesDetails.map((opp) => (
                <tr key={opp.userId} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">{opp.userName || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{opp.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground font-medium">{opp.currentPlanName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {opp.blockedFeatures.map(f => (
                        <span key={f} className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-indigo-600">
                      {opp.recommendedPlanName || "Next Tier"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-green-600">
                      +₦{opp.revenueUpside.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`mailto:${opp.userEmail}?subject=Upgrade your ${opp.currentPlanName} plan on CortexFit`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Email Offer &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
