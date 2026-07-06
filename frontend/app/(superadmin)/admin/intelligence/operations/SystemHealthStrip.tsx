"use client";

import { useQuery } from "@tanstack/react-query";
import { OperationsMetrics } from "@/lib/intelligence/types";

export default function SystemHealthStrip() {
  const { data } = useQuery<OperationsMetrics>({
    queryKey: ["intelligence-ops"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/intelligence/operations");
      return res.json();
    },
  });

  if (!data) return <div className="h-20 animate-pulse bg-gray-900 rounded-lg" />;

  return (
    <div className="flex gap-4 p-4 bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
      <HealthItem label="Rollup Freshness" value={data.rollupHealth} status={data.rollupHealth === 'healthy' ? 'good' : 'warning'} />
      <HealthItem label="Avg Pipeline Latency" value={`${data.averageExecutionTime.toFixed(0)}ms`} status="good" />
      <HealthItem label="Queue Status" value={data.queueHealth} status={data.queueHealth === 'healthy' ? 'good' : 'warning'} />
    </div>
  );
}

function HealthItem({ label, value, status }: { label: string, value: string, status: 'good' | 'warning' | 'bad' }) {
  const color = status === "good" ? "text-green-400" : status === "warning" ? "text-yellow-400" : "text-red-400";
  const bgClass = status === "good" ? "bg-green-500" : status === "warning" ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="flex-1 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="relative flex items-center justify-center">
          <div className={`h-2 w-2 rounded-full ${bgClass}`} />
          {status === 'good' && (
            <div className={`absolute h-2 w-2 rounded-full ${bgClass} animate-ping opacity-75`} />
          )}
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-lg font-semibold uppercase ${color}`}>{value}</p>
    </div>
  );
}
