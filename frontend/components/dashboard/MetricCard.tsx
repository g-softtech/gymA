import React from "react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  textColorClass?: string;
  bgColorClass?: string;
  borderColorClass?: string;
}

export function MetricCard({
  label,
  value,
  textColorClass = "text-foreground",
  bgColorClass = "bg-card",
  borderColorClass = "border-border",
}: MetricCardProps) {
  return (
    <div className={`border p-4 rounded-xl flex flex-col justify-between ${bgColorClass} ${borderColorClass} text-card-foreground`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-1 ${textColorClass}`}>{value}</p>
    </div>
  );
}
