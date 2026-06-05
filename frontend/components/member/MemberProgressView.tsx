"use client";

interface ProgressRecord {
  id: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMass: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  notes: string;
  recordedAt: string;
}

export default function MemberProgressView({ records }: { records: ProgressRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
        <p className="text-4xl mb-3">📊</p>
        <p className="font-medium text-gray-600">No progress records yet</p>
        <p className="text-sm mt-1">Your trainer will record your progress here after sessions</p>
      </div>
    );
  }

  const latest = records[records.length - 1];
  const previous = records[records.length - 2];

  const diff = (current: number | null, prev: number | null) => {
    if (!current || !prev) return null;
    const d = current - prev;
    return { value: Math.abs(d).toFixed(1), up: d > 0 };
  };

  // Weight chart
  const chartData = records.filter((r) => r.weightKg !== null);
  const maxWeight = Math.max(...chartData.map((r) => r.weightKg!), 1);
  const minWeight = Math.min(...chartData.map((r) => r.weightKg!), 0);
  const weightRange = maxWeight - minWeight || 1;

  return (
    <div className="space-y-6">
      {/* Latest stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Weight", value: latest.weightKg, unit: "kg", key: "weightKg" as keyof ProgressRecord },
          { label: "Body Fat", value: latest.bodyFatPct, unit: "%", key: "bodyFatPct" as keyof ProgressRecord },
          { label: "Muscle Mass", value: latest.muscleMass, unit: "kg", key: "muscleMass" as keyof ProgressRecord },
          { label: "Chest", value: latest.chestCm, unit: "cm", key: "chestCm" as keyof ProgressRecord },
          { label: "Waist", value: latest.waistCm, unit: "cm", key: "waistCm" as keyof ProgressRecord },
          { label: "Hips", value: latest.hipsCm, unit: "cm", key: "hipsCm" as keyof ProgressRecord },
        ].map((s) => {
          const d = previous ? diff(s.value as number, previous[s.key] as number) : null;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {s.value != null ? `${s.value}${s.unit}` : "—"}
              </p>
              {d && (
                <p className={`text-xs mt-1 font-medium ${d.up ? "text-red-500" : "text-green-500"}`}>
                  {d.up ? "▲" : "▼"} {d.value}{s.unit} from last
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Weight Progress</h2>
          <div className="relative h-40">
            <svg viewBox={`0 0 ${chartData.length * 60} 120`} className="w-full h-full">
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                <line key={pct} x1="0" y1={pct * 100} x2={chartData.length * 60} y2={pct * 100} stroke="#f3f4f6" strokeWidth="1" />
              ))}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                points={chartData.map((r, i) => {
                  const x = i * 60 + 30;
                  const y = 100 - ((r.weightKg! - minWeight) / weightRange) * 90;
                  return `${x},${y}`;
                }).join(" ")}
              />
              {chartData.map((r, i) => {
                const x = i * 60 + 30;
                const y = 100 - ((r.weightKg! - minWeight) / weightRange) * 90;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#6366f1" />
                    <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{r.weightKg}kg</text>
                    <text x={x} y="115" textAnchor="middle" fontSize="8" fill="#9ca3af">
                      {new Date(r.recordedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Records history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Progress History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Body Fat</th>
                <th className="px-4 py-3">Muscle</th>
                <th className="px-4 py-3">Waist</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...records].reverse().map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(r.recordedAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">{r.weightKg != null ? `${r.weightKg}kg` : "—"}</td>
                  <td className="px-4 py-3">{r.bodyFatPct != null ? `${r.bodyFatPct}%` : "—"}</td>
                  <td className="px-4 py-3">{r.muscleMass != null ? `${r.muscleMass}kg` : "—"}</td>
                  <td className="px-4 py-3">{r.waistCm != null ? `${r.waistCm}cm` : "—"}</td>
                  <td className="px-4 py-3 text-gray-400 italic max-w-xs truncate">{r.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
