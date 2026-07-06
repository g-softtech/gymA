"use client";

import { useState } from "react";
import OperationsTab from "./operations/OperationsTab";
import PerformanceTab from "./performance/PerformanceTab";
import ExperimentsTab from "./experiments/ExperimentsTab";

export default function IntelligenceTabs() {
  const [tab, setTab] = useState<"ops" | "perf" | "exp">("ops");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        <button
          onClick={() => setTab("ops")}
          className={`px-4 py-2 text-sm ${
            tab === "ops"
              ? "border-b-2 border-blue-500 text-white"
              : "text-gray-400"
          }`}
        >
          Operations
        </button>

        <button
          onClick={() => setTab("perf")}
          className={`px-4 py-2 text-sm ${
            tab === "perf"
              ? "border-b-2 border-purple-500 text-white"
              : "text-gray-400"
          }`}
        >
          Performance
        </button>

        <button
          onClick={() => setTab("exp")}
          className={`px-4 py-2 text-sm ${
            tab === "exp"
              ? "border-b-2 border-green-500 text-white"
              : "text-gray-400"
          }`}
        >
          Experiments
        </button>
      </div>

      {/* Content */}
      <div className="pt-2">
        {tab === "ops" && <OperationsTab />}
        {tab === "perf" && <PerformanceTab />}
        {tab === "exp" && <ExperimentsTab />}
      </div>
    </div>
  );
}
