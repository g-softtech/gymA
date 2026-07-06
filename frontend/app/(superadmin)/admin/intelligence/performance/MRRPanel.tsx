export default function MRRPanel({
  retainedMRR,
}: {
  retainedMRR: number
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-3">
        Financial Impact
      </h3>

      <div className="space-y-2">
        <div>
          <p className="text-gray-400 text-sm">Retained MRR</p>
          <p className="text-green-400 text-xl font-bold">₦{retainedMRR.toLocaleString()}</p>
        </div>

        {/* Placeholder for future missed churn calculation */}
        <div>
          <p className="text-gray-400 text-sm">Lost MRR Prevented</p>
          <p className="text-green-400 text-xl font-bold">₦{(retainedMRR * 0.8).toLocaleString()}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Net Impact</p>
          <p className="text-white text-xl font-bold">₦{(retainedMRR * 1.8).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
