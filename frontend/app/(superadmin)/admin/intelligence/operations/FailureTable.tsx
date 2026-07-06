"use client";

import { useEffect, useState } from "react";

export default function FailureTable() {
  const [failures, setFailures] = useState<any[]>([]);
  // We will need a new API to fetch failure logs specifically, or fetch from existing logs API
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">
        Execution Failures
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="py-2">Time</th>
              <th>Tenant</th>
              <th>Action</th>
              <th>Error</th>
              <th>Policy</th>
            </tr>
          </thead>

          <tbody>
            {failures.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">No recent execution failures</td>
              </tr>
            ) : (
              failures.map((f, i) => (
                <tr key={i} className="border-b border-gray-800">
                  <td className="py-2">{new Date(f.executedAt).toLocaleTimeString()}</td>
                  <td>{f.tenantId}</td>
                  <td>{f.actionType}</td>
                  <td>{f.outcomeStatus}</td>
                  <td>{f.explorationPolicy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
