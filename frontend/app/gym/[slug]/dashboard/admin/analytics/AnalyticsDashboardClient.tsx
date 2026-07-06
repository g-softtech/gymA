"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionAnalyticsDTO } from "@/lib/subscriptions/analytics/types";
import { generateSubscriptionInsights } from "@/lib/insights/subscriptionInsights";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

// Recharts colors
const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B", "#EF4444"];

export default function AnalyticsDashboardClient({
  initialMetrics,
  tenantSlug,
}: {
  initialMetrics: SubscriptionAnalyticsDTO;
  tenantSlug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Generate dynamic insights
  const insights = generateSubscriptionInsights(initialMetrics);

  const handleDatePreset = (preset: "7d" | "30d" | "90d" | "month" | "year") => {
    setIsNavigating(true);
    const now = new Date();
    let from = new Date();
    let granularity = "day";

    switch (preset) {
      case "7d":
        from = subDays(now, 7);
        break;
      case "30d":
        from = subDays(now, 30);
        break;
      case "90d":
        from = subDays(now, 90);
        granularity = "week";
        break;
      case "month":
        from = startOfMonth(now);
        granularity = "week";
        break;
      case "year":
        from = startOfYear(now);
        granularity = "month";
        break;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from.toISOString());
    params.set("to", now.toISOString());
    params.set("granularity", granularity);

    router.push(`/gym/${tenantSlug}/dashboard/admin/analytics?${params.toString()}`);
    // A small timeout to remove the loading state (shallow routing is fast, but this gives a slight visual cue)
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <div className={`space-y-8 ${isNavigating ? "opacity-60 transition-opacity duration-300" : "transition-opacity duration-300"}`}>
      
      {/* TIME CONTROLS */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => handleDatePreset("7d")} className="px-4 py-2 text-sm font-medium rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">Last 7 Days</button>
        <button onClick={() => handleDatePreset("30d")} className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground shadow-sm">Last 30 Days</button>
        <button onClick={() => handleDatePreset("90d")} className="px-4 py-2 text-sm font-medium rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">Last 90 Days</button>
        <button onClick={() => handleDatePreset("month")} className="px-4 py-2 text-sm font-medium rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">This Month</button>
        <button onClick={() => handleDatePreset("year")} className="px-4 py-2 text-sm font-medium rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">This Year</button>
      </div>

      {/* INSIGHT LAYER */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const isCritical = insight.severity === "critical";
            const isWarning = insight.severity === "warning";
            const isSuccess = insight.severity === "success";

            return (
              <div 
                key={insight.id} 
                className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-300 hover:scale-[1.01] ${
                  isCritical ? "bg-destructive/10 border-destructive/20 text-destructive-foreground" :
                  isWarning ? "bg-warning/10 border-warning/20 text-warning-foreground" :
                  isSuccess ? "bg-success/10 border-success/20 text-success-foreground" :
                  "bg-muted/50 border-border text-foreground"
                }`}
              >
                <div className="text-2xl mt-1">
                  {isCritical ? "🚨" : isWarning ? "⚠️" : isSuccess ? "⭐" : "💡"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{insight.message}</p>
                  {insight.actionableRecommendation && (
                    <p className="text-xs mt-1 opacity-90">{insight.actionableRecommendation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Renewal Rate", value: `${initialMetrics.renewalRate}%`, sub: "Eligible renewals" },
          { label: "Retention Rate", value: `${initialMetrics.retentionRate}%`, sub: "Net of new joins" },
          { label: "Recovery Rate", value: `${initialMetrics.recoveryRate}%`, sub: "Failed payments saved" },
          { label: "Avg Lifetime", value: `${initialMetrics.averageLifetimeMonths} mo`, sub: "Continuous duration" },
          { label: "Revenue at Risk", value: `₦${initialMetrics.upcomingRevenueAtRisk.toLocaleString()}`, sub: "Expiring in 30 days" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card text-card-foreground rounded-xl p-5 border border-border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
            <h3 className="text-sm font-medium text-muted-foreground">{kpi.label}</h3>
            <p className="text-2xl font-bold mt-2">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-80">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* MAIN CHART - EXPIRING TRENDS */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">Expiring Subscriptions Trend</h3>
        {initialMetrics.expiringTrend.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
            <span className="text-4xl mb-3">📈</span>
            <p className="font-medium">Not enough data to display trends.</p>
            <p className="text-sm mt-1">Expirations will appear here as they approach.</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={initialMetrics.expiringTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                <XAxis 
                  dataKey="period" 
                  tickFormatter={(val) => format(new Date(val), "MMM dd")} 
                  stroke="currentColor" 
                  className="text-xs opacity-50"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="currentColor" 
                  className="text-xs opacity-50"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                  labelFormatter={(val) => format(new Date(val), "MMM dd, yyyy")}
                />
                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECONDARY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DISTRIBUTION PIE */}
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-6">Subscription Distribution</h3>
          {initialMetrics.distribution.length === 0 || initialMetrics.distribution.every(d => d.count === 0) ? (
            <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
              <span className="text-4xl mb-3">🍩</span>
              <p className="font-medium">No active subscriptions yet.</p>
            </div>
          ) : (
            <div className="h-[250px] w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={initialMetrics.distribution.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="planName"
                  >
                    {initialMetrics.distribution.filter(d => d.count > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* REVENUE RISK TREND (Placeholder for future iteration as requested) */}
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 opacity-60 relative overflow-hidden">
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-4 py-2 bg-muted text-muted-foreground rounded-full text-sm font-semibold tracking-widest uppercase">Coming Soon</span>
          </div>
          <h3 className="text-lg font-semibold mb-6">Revenue Risk Over Time</h3>
          <div className="h-[250px] w-full bg-muted/20 rounded-lg border border-dashed border-border"></div>
        </div>
      </div>

    </div>
  );
}
