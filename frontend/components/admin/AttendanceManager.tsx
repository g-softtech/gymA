
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  memberName: string;
  checkedInAt: string;
  note: string;
}

interface Props {
  tenantId: string;
  members: Member[];
  initialRecords: AttendanceRecord[];
}

export default function AttendanceManager({ tenantId, members, initialRecords }: Props) {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [selectedMember, setSelectedMember] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCheckIn = async () => {
    setError("");
    setSuccess("");
    if (!selectedMember) {
      setError("Please select a member.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember, tenantId, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to check in.");
      } else {
        const memberName = members.find((m) => m.id === selectedMember)?.name ?? "Member";
        const newRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          memberName,
          checkedInAt: new Date().toISOString(),
          note,
        };
        setRecords((prev) => [newRecord, ...prev]);
        setSelectedMember("");
        setNote("");
        setSuccess(`${memberName} checked in successfully!`);
        router.refresh();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Check-in Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Manual Check-in</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded mb-4">✅ {success}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Select Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Morning session"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
        >
          {loading ? "Checking in..." : "✅ Check In Member"}
        </button>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900">Recent Check-ins</h2>
          <span className="text-sm text-gray-400">{records.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    No check-ins yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.memberName}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(r.checkedInAt).toLocaleDateString("en-NG", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(r.checkedInAt).toLocaleTimeString("en-NG", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-400 italic">
                      {r.note || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
