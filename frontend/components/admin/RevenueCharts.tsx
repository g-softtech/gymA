
"use client";

interface MonthlyData {
  month: string;
  revenue: number;
}

interface PlanData {
  name: string;
  count: number;
  revenue: number;
}

interface Props {
  monthlyData: MonthlyData[];
  planData: PlanData[];
}

export default function RevenueCharts({ monthlyData, planData }: Props) {
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Revenue Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Monthly Revenue (Last 6 Months)</h2>
        <div className="flex items-end gap-3 h-40">
          {monthlyData.map((d) => {
            const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  {d.revenue > 0 ? `₦${(d.revenue / 1000).toFixed(0)}k` : "—"}
                </span>
                <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: "100px" }}>
                  <div
                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 text-center leading-tight">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Revenue by Plan</h2>
        {planData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No data yet.</p>
        ) : (
          <div className="space-y-4">
            {planData.map((p) => {
              const totalRevenue = planData.reduce((s, d) => s + d.revenue, 0);
              const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-gray-500">
                      ₦{p.revenue.toLocaleString()} · {p.count} sub{p.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
