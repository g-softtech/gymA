"use client";

import { useQuery } from "@tanstack/react-query";
import FunnelChart from "./FunnelChart";
import ModelLeaderboard from "./ModelLeaderboard";
import MRRPanel from "./MRRPanel";
import { PerformanceMetrics } from "@/lib/intelligence/types";

export default function PerformanceTab() {
  const { data } = useQuery<PerformanceMetrics>({
    queryKey: ["intelligence-perf"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/intelligence/performance");
      return res.json();
    },
  });

  if (!data) return <div className="h-64 animate-pulse bg-gray-900 rounded-lg" />;

  const funnelData = [
    { stage: "Generated", value: data.generatedCount },
    { stage: "Viewed", value: Math.floor(data.generatedCount * 0.8) }, // Placeholder
    { stage: "Approved", value: data.generatedCount }, // Implicit in current model
    { stage: "Executed", value: data.generatedCount }, // Implicit in current model
    { stage: "Success", value: data.successCount },
  ];

  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModelLeaderboard policies={data.policyComparisons} />
        <MRRPanel retainedMRR={data.retainedMRR} />
      </div>

      {/* Funnel (Centerpiece) */}
      <FunnelChart data={funnelData} />
    </div>
  );
}
