"use client";

import { useQuery } from "@tanstack/react-query";
import SystemHealthStrip from "./SystemHealthStrip";
import FailureTable from "./FailureTable";
import { OperationsMetrics } from "@/lib/intelligence/types";

export default function OperationsTab() {
  const { data } = useQuery<OperationsMetrics>({
    queryKey: ["intelligence-ops"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/intelligence/operations");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Global Health Strip */}
      <SystemHealthStrip />

      {/* Alerts */}
      <div className="grid grid-cols-3 gap-4">
        <AlertCard 
          title="Rollup Freshness" 
          value={data ? data.rollupHealth : "..."} 
          status={data?.rollupHealth === 'healthy' ? "good" : data?.rollupHealth === 'warning' ? "warning" : "bad"} 
        />
        <AlertCard 
          title="Execution Failures" 
          value={data ? data.failedCount.toString() : "..."} 
          status={data && data.failedCount > 0 ? "warning" : "good"} 
        />
        <AlertCard 
          title="Queue Status" 
          value={data ? data.queueHealth : "..."} 
          status={data?.queueHealth === 'healthy' ? 'good' : 'bad'} 
        />
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Avg Exec Time" value={data ? `${data.averageExecutionTime.toFixed(0)}ms` : "..."} />
        <MetricCard label="Eval Delay" value={data ? `${(data.averageEvaluationDelay / 1000).toFixed(1)}s` : "..."} />
        {/* Can add Generated/Executed/Ignored to operations or performance as needed */}
      </div>

      {/* Failure Table */}
      <FailureTable />
    </div>
  );
}

/* --- Small UI Components --- */

function AlertCard({
  title,
  value,
  status,
}: {
  title: string;
  value: string;
  status: "good" | "warning" | "bad";
}) {
  const color =
    status === "good"
      ? "text-green-400"
      : status === "warning"
      ? "text-yellow-400"
      : "text-red-400";
      
  const bgClass = 
    status === "good" 
      ? "bg-green-500" 
      : status === "warning" 
      ? "bg-yellow-500" 
      : "bg-red-500";

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex items-center justify-center">
          <div className={`h-2 w-2 rounded-full ${bgClass}`} />
          {status === 'good' && (
            <div className={`absolute h-2 w-2 rounded-full ${bgClass} animate-ping opacity-75`} />
          )}
        </div>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
      <p className={`text-lg font-semibold uppercase ${color}`}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg text-white font-semibold">{value}</p>
    </div>
  );
}
