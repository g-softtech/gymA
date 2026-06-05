"use client";

import { useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00",
];

interface BookingItem {
  id: string;
  memberName: string;
  date: string;
  durationMins: number;
  sessionType: string;
  status: string;
  notes: string;
}

interface Props {
  trainerId: string;
  availability: Record<string, string[]>;
  bookings: BookingItem[];
}

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CANCELLED: "bg-red-100 text-red-600 border-red-200",
  RESCHEDULED: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function ScheduleManager({
  trainerId,
  availability: initialAvailability,
  bookings,
}: Props) {
  const [availability, setAvailability] = useState<Record<string, string[]>>(
    initialAvailability ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"availability" | "calendar">("availability");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const toggleSlot = (day: string, slot: string) => {
    const current = availability[day] ?? [];
    const updated = current.includes(slot)
      ? current.filter((s) => s !== slot)
      : [...current, slot].sort();
    setAvailability({ ...availability, [day]: updated });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/trainer/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Pad start
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < startDow; i++) days.push(null);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((b) => {
      const bd = new Date(b.date);
      return (
        bd.getDate() === date.getDate() &&
        bd.getMonth() === date.getMonth() &&
        bd.getFullYear() === date.getFullYear()
      );
    });
  };

  const isAvailableDay = (date: Date) => {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return (availability[dayName] ?? []).length > 0;
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const days = getDaysInMonth(currentMonth);
  const monthLabel = currentMonth.toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  // Selected date detail
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];
  const selectedDayName = selectedDate?.toLocaleDateString("en-US", { weekday: "long" });
  const selectedSlots = selectedDate ? (availability[selectedDayName ?? ""] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "availability", label: "📋 Weekly Availability" },
          { key: "calendar", label: "📅 Calendar View" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "availability" | "calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Availability tab */}
      {activeTab === "availability" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Weekly Availability</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Set which days and times you are available for bookings each week
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              {saving ? "Saving..." : saved ? "✅ Saved!" : "Save Availability"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3 pr-4 w-16">Time</th>
                  {DAYS.map((d) => (
                    <th key={d} className="text-center text-xs text-gray-500 font-medium pb-3 px-1">
                      {d.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} className="border-t border-gray-50">
                    <td className="text-xs text-gray-400 py-1.5 pr-4 whitespace-nowrap">{slot}</td>
                    {DAYS.map((day) => {
                      const active = (availability[day] ?? []).includes(slot);
                      return (
                        <td key={day} className="text-center px-1 py-1">
                          <button
                            onClick={() => toggleSlot(day, slot)}
                            className={`w-7 h-7 rounded-md border text-xs font-medium transition-all ${
                              active
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-gray-50 border-gray-200 text-gray-300 hover:border-indigo-300"
                            }`}
                          >
                            {active ? "✓" : ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Your weekly availability summary:</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const slots = availability[day] ?? [];
                if (slots.length === 0) return null;
                return (
                  <div key={day} className="bg-indigo-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-semibold text-indigo-700">{day.slice(0, 3)}: </span>
                    <span className="text-xs text-indigo-600">{slots[0]} – {slots[slots.length - 1]}</span>
                    <span className="text-xs text-indigo-400 ml-1">({slots.length} slots)</span>
                  </div>
                );
              })}
              {DAYS.every((d) => (availability[d] ?? []).length === 0) && (
                <p className="text-xs text-gray-400 italic">No availability set yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar tab */}
      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">←</button>
              <h2 className="text-base font-semibold text-gray-900">{monthLabel}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">→</button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                if (!date) return <div key={i} />;
                const dayBookings = getBookingsForDate(date);
                const available = isAvailableDay(date);
                const past = isPast(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`relative p-2 rounded-lg text-sm transition-all min-h-[48px] flex flex-col items-center justify-start gap-0.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : isToday
                        ? "border-2 border-indigo-400 text-indigo-700"
                        : past
                        ? "text-gray-300"
                        : available
                        ? "hover:bg-indigo-50 text-gray-700"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{date.getDate()}</span>
                    {available && !past && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-indigo-400"}`} />
                    )}
                    {dayBookings.length > 0 && (
                      <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-green-600"}`}>
                        {dayBookings.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Available
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Has bookings
              </div>
            </div>
          </div>

          {/* Selected date detail */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {!selectedDate ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm">Click a date to see details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString("en-NG", {
                      weekday: "long", month: "long", day: "numeric",
                    })}
                  </h3>
                </div>

                {/* Available slots */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Available Time Slots</p>
                  {selectedSlots.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Not available this day</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSlots.map((slot) => {
                        const booked = selectedBookings.some((b) => {
                          const bTime = new Date(b.date).toLocaleTimeString("en-NG", {
                            hour: "2-digit", minute: "2-digit", hour12: false,
                          });
                          return bTime === slot;
                        });
                        return (
                          <span
                            key={slot}
                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                              booked
                                ? "bg-red-100 text-red-600 line-through"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {slot}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bookings on this day */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Bookings ({selectedBookings.length})
                  </p>
                  {selectedBookings.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No bookings this day</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedBookings.map((b) => (
                        <div key={b.id} className={`rounded-lg p-2.5 border text-xs ${statusColor[b.status] ?? "bg-gray-50 border-gray-200"}`}>
                          <p className="font-semibold">{b.memberName}</p>
                          <p>
                            {new Date(b.date).toLocaleTimeString("en-NG", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                            {" · "}{b.durationMins}min · {b.sessionType}
                          </p>
                          <p className="capitalize mt-0.5 font-medium">{b.status.toLowerCase()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
