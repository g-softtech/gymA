
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
  checkInTime: string;
  notes: string;
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
  const [notes, setNotes] = useState("");
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
        body: JSON.stringify({ memberId: selectedMember, tenantId, note: notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to check in.");
      } else {
        const memberName = members.find((m) => m.id === selectedMember)?.name ?? "Member";
        const newRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          memberName,
          checkInTime: new Date().toISOString(),
          notes,
        };
        setRecords((prev) => [newRecord, ...prev]);
        setSelectedMember("");
        setNotes("");
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
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Manual Check-in</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded mb-4">✅ {success}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Select Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Morning session"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-semibold text-foreground">Recent Check-ins</h2>
          <span className="text-sm text-muted-foreground">{records.length} records</span>
        </div>
        {/* Mobile View: Timeline UI */}
        <div className="md:hidden divide-y divide-border">
          {records.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No check-ins yet.</div>
          ) : (
            <div className="p-4 space-y-4">
              {records.map((r) => (
                <div key={r.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                      {r.memberName.charAt(0)}
                    </div>
                    <div className="w-px h-full bg-muted my-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-bold text-foreground">{r.memberName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.checkInTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      {" "}·{" "}
                      {new Date(r.checkInTime).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </p>
                    {r.notes && (
                      <p className="text-sm text-muted-foreground italic mt-1 bg-muted p-2 rounded-lg">
                        "{r.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tablet/Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    No check-ins yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {r.memberName.charAt(0)}
                      </div>
                      {r.memberName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(r.checkInTime).toLocaleDateString("en-NG", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(r.checkInTime).toLocaleTimeString("en-NG", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground italic">
                      {r.notes || "—"}
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
