"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface FeatureData {
  feature: string;
  usageCount: number;
  distinctUsers: number;
  adoptionPercent: number;
}

export default function EntitlementAnalyticsClient() {
  const [data, setData] = useState<{
    blockedRequests: number;
    blockedUsersCount: number;
    mostUsedFeatures: FeatureData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/entitlements");
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch entitlement analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse bg-muted rounded-xl h-48 w-full mb-8" />;
  if (!data || data.mostUsedFeatures.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-destructive">Total Blocked Requests</p>
            <h3 className="text-3xl font-bold text-destructive mt-1">{data.blockedRequests}</h3>
          </div>
          <div className="text-3xl">🚨</div>
        </div>
        <div className="bg-warning/10 p-6 rounded-xl border border-warning/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-warning">Users Hitting Limits</p>
            <h3 className="text-3xl font-bold text-warning mt-1">{data.blockedUsersCount}</h3>
          </div>
          <div className="text-3xl">⚠️</div>
        </div>
      </div>

      {/* Most Used Features — Horizontal Bar Chart */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6">
        <h3 className="text-base font-bold text-foreground mb-1">Feature Adoption</h3>
        <p className="text-xs text-muted-foreground mb-6">Percentage of active subscribers using each feature</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.mostUsedFeatures}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={(val) => `${val}%`} domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  name === "adoptionPercent" ? `${val}%` : val,
                  name === "adoptionPercent" ? "Adoption" : "Distinct Users",
                ]}
                contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)", fontSize: "12px" }}
              />
              <Bar dataKey="adoptionPercent" name="Adoption" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
