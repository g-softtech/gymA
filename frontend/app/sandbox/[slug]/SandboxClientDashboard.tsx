"use client";

import React, { useState } from "react";
import { useDemoGuard } from "@/components/sandbox/DemoToast";

export function SandboxClientDashboard({
  tenant,
  plans,
  members,
  mrr,
  outstanding,
}: {
  tenant: any;
  plans: any[];
  members: any[];
  mrr: number;
  outstanding: number;
}) {
  const [activeTab, setActiveTab] = useState("revenue");
  const { withDemoGuard } = useDemoGuard();

  const activeMembers = members.filter((m) => m.memberProfile.subscriptions[0]?.status === "ACTIVE");
  const expiredMembers = members.filter((m) => m.memberProfile.subscriptions[0]?.status === "EXPIRED");
  const suspendedMembers = members.filter((m) => m.memberProfile.subscriptions[0]?.status === "SUSPENDED");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              Live Sandbox
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              {tenant.name}
            </h1>
            <p className="text-gray-500 mt-1">Admin Dashboard Preview</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button 
              onClick={withDemoGuard()}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Settings
            </button>
            <button 
              onClick={withDemoGuard()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition"
            >
              + Add Member
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl w-max">
          {["revenue", "analytics", "intelligence"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab 
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 md:p-8">
          
          {activeTab === "revenue" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Revenue Ledger</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-xl">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Monthly Recurring Revenue (MRR)</p>
                  <p className="text-3xl font-black text-green-700 dark:text-green-300 mt-1">₦{mrr.toLocaleString()}</p>
                </div>
                <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Outstanding Dues</p>
                    <p className="text-3xl font-black text-red-700 dark:text-red-300 mt-1">₦{outstanding.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={withDemoGuard()}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition"
                  >
                    Chase Payments
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-sm text-gray-500">
                      <th className="pb-3 font-medium">Member Name</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {members.map((m) => (
                      <tr key={m.id} className="text-sm">
                        <td className="py-4 font-medium">{m.user.name}</td>
                        <td className="py-4 text-gray-500">{m.memberProfile.subscriptions[0]?.plan.name}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            m.memberProfile.subscriptions[0]?.status === "ACTIVE" 
                              ? "bg-green-100 text-green-700" 
                              : m.memberProfile.subscriptions[0]?.status === "EXPIRED"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {m.memberProfile.subscriptions[0]?.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button onClick={withDemoGuard()} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Analytics & Attendance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-xl">
                  <div className="text-2xl font-black">{activeMembers.length}</div>
                  <div className="text-sm text-gray-500">Active Members</div>
                </div>
                <div className="p-4 border rounded-xl">
                  <div className="text-2xl font-black">{expiredMembers.length}</div>
                  <div className="text-sm text-gray-500">Expired Members</div>
                </div>
                <div className="p-4 border rounded-xl">
                  <div className="text-2xl font-black">{suspendedMembers.length}</div>
                  <div className="text-sm text-gray-500">Suspended</div>
                </div>
              </div>
              <div className="h-64 bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center">
                <p className="text-gray-400 font-medium">[Interactive Chart Placeholder: Attendance Heatmap]</p>
              </div>
            </div>
          )}

          {activeTab === "intelligence" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                ✨ AI Churn Intelligence
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                CortexFit AI analyzes check-in patterns, payment history, and engagement to flag members at risk of canceling their memberships.
              </p>
              
              <div className="grid grid-cols-1 gap-4 mt-6">
                {members.filter(m => m.memberProfile.churnScore >= 50).map((m) => (
                  <div key={m.id} className="p-5 border border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold">{m.user.name}</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                          {m.memberProfile.churnScore}% Churn Risk
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {m.memberProfile.suspensionReason || "Pattern of declining attendance over the last 3 weeks."}
                      </p>
                    </div>
                    <button 
                      onClick={withDemoGuard()}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition shadow-sm"
                    >
                      Trigger Intervention
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
