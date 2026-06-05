"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookingItem {
  id: string;
  memberName: string;
  memberEmail: string;
  date: string;
  durationMins: number;
  sessionType: string;
  status: string;
  notes: string;
  meetingLink: string;
}

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-indigo-100 text-indigo-700",
  CANCELLED: "bg-red-100 text-red-600",
  RESCHEDULED: "bg-purple-100 text-purple-700",
};

export default function BookingApprovals({ bookings: initialBookings }: { bookings: BookingItem[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("ALL");

  const updateStatus = async (bookingId: string, status: string) => {
    setLoadingId(bookingId);
    try {
      const meetingLink = meetingLinks[bookingId] ?? "";
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, meetingLink }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => b.id === bookingId ? { ...b, status, meetingLink: meetingLink || b.meetingLink } : b)
        );
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const filters = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
          >
            {f}
            {f !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({bookings.filter((b) => b.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          No bookings in this category.
        </div>
      ) : (
        filtered.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-900">{b.memberName}</p>
                <p className="text-sm text-gray-500">{b.memberEmail}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[b.status] ?? "bg-gray-100 text-gray-500"}`}>
                {b.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(b.date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(b.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                <p className="font-medium text-gray-900">{b.durationMins} min</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Type</p>
                <p className="font-medium text-gray-900">{b.sessionType}</p>
              </div>
            </div>

            {b.notes && (
              <p className="text-sm text-gray-500 italic mb-3">Note: {b.notes}</p>
            )}

            {/* Online session — meeting link */}
            {b.sessionType === "ONLINE" && b.status === "PENDING" && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Link (optional)</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={meetingLinks[b.id] ?? b.meetingLink}
                  onChange={(e) => setMeetingLinks({ ...meetingLinks, [b.id]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {b.meetingLink && b.status === "CONFIRMED" && (
              <a
                href={b.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline mb-3 block"
              >
                🔗 Join Online Session
              </a>
            )}

            {/* Action buttons */}
            {b.status === "PENDING" && (
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus(b.id, "CONFIRMED")}
                  disabled={loadingId === b.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
                >
                  {loadingId === b.id ? "..." : "✅ Confirm"}
                </button>
                <button
                  onClick={() => updateStatus(b.id, "CANCELLED")}
                  disabled={loadingId === b.id}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg text-sm border border-red-200 transition"
                >
                  ❌ Decline
                </button>
              </div>
            )}

            {b.status === "CONFIRMED" && (
              <button
                onClick={() => updateStatus(b.id, "COMPLETED")}
                disabled={loadingId === b.id}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
              >
                {loadingId === b.id ? "..." : "🏆 Mark as Completed"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
