"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function MemberBookingsClient({ bookings: initialBookings }: { bookings: any[] }) {
  const [bookings, setBookings] = useState(initialBookings);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const toastId = toast.loading("Cancelling...");
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        toast.success("Booking cancelled", { id: toastId });
        setBookings(bookings.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b));
      } else {
        toast.error("Failed to cancel", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error", { id: toastId });
    }
  };

  const upcoming = bookings.filter(b => ["PENDING", "CONFIRMED"].includes(b.status) && new Date(b.date) >= new Date());
  const past = bookings.filter(b => !upcoming.includes(b));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            You have no upcoming sessions.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(b => (
              <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {b.classSessionId ? b.classSession.title : "1-on-1 Session"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(b.date).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {b.classSessionId ? (
                        b.classSession.instructor?.user?.image ? <img src={b.classSession.instructor.user.image} alt="" className="w-full h-full object-cover" /> : "👤"
                      ) : (
                        b.trainer?.user?.image ? <img src={b.trainer.user.image} alt="" className="w-full h-full object-cover" /> : "👤"
                      )}
                    </span>
                    {b.classSessionId ? (b.classSession.instructor?.user?.name || "Unassigned") : b.trainer?.user?.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                    b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {b.status}
                  </span>
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="block text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Past & Cancelled</h2>
        {past.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            No history yet.
          </div>
        ) : (
          <div className="space-y-3">
            {past.map(b => (
              <div key={b.id} className="bg-gray-50 rounded-xl border border-gray-100 p-5 flex items-center justify-between opacity-75">
                <div>
                  <h3 className="font-medium text-gray-700">
                    {b.classSessionId ? b.classSession.title : "1-on-1 Session"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(b.date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  b.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
