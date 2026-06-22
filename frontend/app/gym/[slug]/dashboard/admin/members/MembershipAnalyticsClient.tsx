"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function MembershipAnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics/membership");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch analytics");
        setData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-xl h-48 w-full"></div>;
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Members</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{data.activeMembers}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg text-2xl">👥</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">New This Month</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{data.newMembersThisMonth}</h3>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg text-2xl">📈</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Retention Rate</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{data.retentionRate}%</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg text-2xl">❤️</div>
        </div>
      </div>

      {data.membersByPlan && data.membersByPlan.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Members by Plan</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.membersByPlan}
                  dataKey="activeMembers"
                  nameKey="planName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.membersByPlan.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
