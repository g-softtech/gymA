export default function ModelLeaderboard({
  policies
}: {
  policies: { algorithmVersion: number, explorationPolicy: string, successRate: number, sampleSize: number }[]
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-3">
        Policy Performance
      </h3>

      <div className="space-y-3 text-sm">
        {policies.length === 0 ? (
          <p className="text-gray-500">No policy data available</p>
        ) : (
          policies.map((p, i) => (
            <div key={i} className="flex justify-between items-center">
              <div>
                <span className="text-gray-400">{p.explorationPolicy} (v{p.algorithmVersion})</span>
                <span className="text-xs text-gray-600 block">n={p.sampleSize}</span>
              </div>
              <span className={p.successRate > 0.5 ? "text-green-400" : "text-yellow-400"}>
                {(p.successRate * 100).toFixed(1)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
