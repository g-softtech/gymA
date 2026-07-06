import React from "react";

export interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function MetricGrid({ children, columns = 4, className = "" }: MetricGridProps) {
  const colClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
  };

  return (
    <div className={`grid grid-cols-2 ${colClasses[columns]} gap-4 mb-8 ${className}`}>
      {children}
    </div>
  );
}
