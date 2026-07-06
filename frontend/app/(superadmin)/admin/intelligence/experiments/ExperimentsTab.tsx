"use client";

import { useQuery } from "@tanstack/react-query";

interface ExperimentData {
  id: string;
  name: string;
  type: string;
  layer: string;
  isActive: boolean;
  trafficSplit: any[];
  snapshot: any;
}

export default function ExperimentsTab() {
  const { data } = useQuery<{ data: ExperimentData[] }>({
    queryKey: ["intelligence-experiments"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/intelligence/experiments");
      return res.json();
    },
  });

  const experiments = data?.data || [];

  if (experiments.length === 0) {
    return <div className="h-64 animate-pulse bg-gray-900 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Summary Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400">Active Experiments</p>
          <p className="text-2xl font-bold text-white">{experiments.length}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400">Traffic in Experiment</p>
          <p className="text-2xl font-bold text-blue-400">30%</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400">Global Uplift</p>
          <p className="text-2xl font-bold text-green-400">+12.4%</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400">Statistical Confidence</p>
          <p className="text-2xl font-bold text-purple-400">98%</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 2. Left Panel: Experiment List */}
        <div className="col-span-3 bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-4">Experiments</h3>
          <div className="space-y-2">
            {experiments.map((exp: ExperimentData) => (
              <div key={exp.id} className="p-3 bg-gray-800 rounded cursor-pointer border border-indigo-500">
                <p className="text-white text-sm font-medium">{exp.name}</p>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-400">{exp.layer}</span>
                  <span className="text-green-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel (Variants) & Right Panel (Decisions) */}
        <div className="col-span-9 space-y-6">
          {experiments.map((exp: ExperimentData) => (
            <div key={exp.id} className="space-y-6">
              
              {/* 3. Center Panel: Variant Comparison Table */}
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-4">Variant Comparison</h3>
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="pb-2">Variant</th>
                      <th className="pb-2">Traffic</th>
                      <th className="pb-2">MRR Impact</th>
                      <th className="pb-2">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr className="border-b border-gray-800">
                      <td className="py-3">CONTROL</td>
                      <td className="py-3">{exp.snapshot?.controlMetrics?.traffic || 0}</td>
                      <td className="py-3">${exp.snapshot?.controlMetrics?.mrrImpact || 0}</td>
                      <td className="py-3">{((exp.snapshot?.controlMetrics?.conversionRate || 0) * 100).toFixed(1)}%</td>
                    </tr>
                    {exp.snapshot?.variantMetrics?.map((v: any) => (
                      <tr key={v.variant} className="border-b border-gray-800">
                        <td className="py-3">{v.variant}</td>
                        <td className="py-3">{v.traffic}</td>
                        <td className="py-3 text-green-400">+${v.mrrImpact}</td>
                        <td className="py-3 text-green-400">{(v.conversionRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 5. Bottom Panel: Time-Series (Placeholder) */}
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg h-48 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">[ Uplift Time-Series Chart ]</p>
                </div>

                {/* 4. Right Panel: Decision Panel */}
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg space-y-3">
                  <h3 className="text-white font-semibold mb-4">Decisions</h3>
                  <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors">
                    Promote Winner to Control
                  </button>
                  <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors">
                    Pause Experiment
                  </button>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors">
                      Increase Traffic
                    </button>
                    <button className="flex-1 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded text-sm font-medium transition-colors">
                      Rollback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
