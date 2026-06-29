"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface TrainerStat {
  trainerId: string;
  trainerName: string | null;
  totalSessions: number;
  activeClients: number;
  utilizationPct: number;
}

const COLORS = ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

export default function TrainerAnalyticsClient() {
  const [data, setData] = useState<{
    trainers: TrainerStat[];
    totalSessions: number;
    totalActiveClients: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/trainers");
        const json = await res.json();
        if (json.data) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch trainer analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse bg-muted rounded-xl h-48 w-full mb-8" />;
  if (!data || data.trainers.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Sessions Booked</p>
            <h3 className="text-3xl font-bold text-foreground mt-1">{data.totalSessions}</h3>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-lg text-2xl">🏋️</div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Active Clients</p>
            <h3 className="text-3xl font-bold text-foreground mt-1">{data.totalActiveClients}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-2xl">👥</div>
        </div>
      </div>

      {/* Sessions Per Trainer — Bar Chart */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6">
        <h3 className="text-base font-bold text-foreground mb-1">Sessions by Trainer</h3>
        <p className="text-xs text-muted-foreground mb-6">Total sessions booked per trainer (excluding cancellations)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.trainers}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="trainerName"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  val,
                  name === "totalSessions" ? "Sessions" : "Active Clients",
                ]}
                contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)", fontSize: "12px" }}
              />
              <Bar dataKey="totalSessions" name="Sessions" radius={[6, 6, 0, 0]}>
                {data.trainers.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trainer Utilization table */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Trainer Utilization</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Trainer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Sessions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.trainers.map((t: TrainerStat) => (
                <tr key={t.trainerId} className="hover:bg-muted transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{t.trainerName || "Unknown"}</td>
                  <td className="px-6 py-4 text-foreground">{t.totalSessions}</td>
                  <td className="px-6 py-4 text-foreground">{t.activeClients}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-2 max-w-[120px]">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(t.utilizationPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{t.utilizationPct}%</span>
                    </div>
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
