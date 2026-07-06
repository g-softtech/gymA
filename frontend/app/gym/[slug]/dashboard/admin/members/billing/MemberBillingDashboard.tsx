"use client";

import React from "react";

type SubscriptionRow = {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  planName: string;
  status: string;
  endDate: string | null;
  trialEndDate: string | null;
};

type Stats = {
  active: number;
  trialing: number;
  pastDue: number;
  suspended: number;
  expired: number;
  expiring24h: number;
  expiring3d: number;
  expiring7d: number;
  churnRate: number;
};

export default function MemberBillingDashboard({ stats, subscriptions }: { stats: Stats, subscriptions: SubscriptionRow[] }) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded">ACTIVE</span>;
      case "TRIALING":
        return <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-semibold rounded">TRIALING</span>;
      case "PAST_DUE":
        return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-semibold rounded">PAST DUE</span>;
      case "EXPIRED":
        return <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded">EXPIRED</span>;
      case "SUSPENDED":
      case "CANCELED":
      case "UNPAID":
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-500 text-xs font-semibold rounded">{status}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-500 text-xs font-semibold rounded">{status}</span>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Billing Dashboard</h1>
          <p className="text-zinc-400 mt-1">Gym member revenue and subscription health</p>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">ACTIVE / HEALTHY</p>
            <p className="text-4xl font-bold text-emerald-400">{stats.active}</p>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">TRIALING</p>
            <p className="text-4xl font-bold text-blue-400">{stats.trialing}</p>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">PAST DUE</p>
            <p className="text-4xl font-bold text-amber-400">{stats.pastDue}</p>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">SUSPENDED</p>
            <p className="text-4xl font-bold text-red-500">{stats.suspended}</p>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">EXPIRED</p>
            <p className="text-4xl font-bold text-red-500">{stats.expired}</p>
          </div>
        </div>

        {/* Middle Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">EXPIRING IN 24H</p>
            <p className="text-4xl font-bold text-amber-500">{stats.expiring24h}</p>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">EXPIRING IN 3D</p>
            <p className="text-4xl font-bold text-amber-500">{stats.expiring3d}</p>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">EXPIRING IN 7D</p>
            <p className="text-4xl font-bold text-amber-500">{stats.expiring7d}</p>
          </div>
          <div className="bg-[#121212] border border-white/5 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-500 tracking-wider mb-2">CHURN RATE (EXPIRED+SUSP)</p>
            <p className="text-4xl font-bold text-red-500">{stats.churnRate}%</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden mt-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 tracking-wider uppercase">Member</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 tracking-wider uppercase">Plan</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 tracking-wider uppercase">Billing Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 tracking-wider uppercase">Billing Ends</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 tracking-wider uppercase">Trial Ends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                          {sub.memberName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-zinc-200">{sub.memberName}</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">{sub.memberEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-300">
                      {sub.planName}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {formatDate(sub.endDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {formatDate(sub.trialEndDate)}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">
                      No member subscriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
