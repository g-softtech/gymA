"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Trainer {
  id: string;
  userId: string;
  name: string;
  specialties: string[];
  bio: string;
  hourlyRate: number | null;
  availability: Record<string, string[]>;
}

interface Props {
  tenantId: string;
  memberId: string;
  trainers: Trainer[];
}

const SESSION_TYPES = ["PHYSICAL", "ONLINE"];
const DURATIONS = [30, 45, 60, 90, 120];

export default function BookingForm({ tenantId, memberId, trainers }: Props) {
  const router = useRouter();
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [sessionType, setSessionType] = useState("PHYSICAL");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const selectedDay = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })
    : null;

  const availableSlots =
    selectedTrainer && selectedDay
      ? selectedTrainer.availability[selectedDay] ?? []
      : [];

  const hasAvailability = Object.values(selectedTrainer?.availability ?? {}).some(
    (slots) => Array.isArray(slots) && slots.length > 0
  );

  const finalTime = availableSlots.length > 0 ? time : customTime;

  const handleBook = async () => {
    setError("");
    setSuccess("");
    if (!selectedTrainer?.id) { setError("Please select a trainer."); return; }
    if (!date) { setError("Please select a date."); return; }
    if (!finalTime) { setError("Please select or enter a time."); return; }
    if (!memberId) {
      setError("Member profile not found. Please save your profile first.");
      return;
    }
    setLoading(true);
    try {
      const dateTime = new Date(`${date}T${finalTime}:00`);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: selectedTrainer.id,
          date: dateTime.toISOString(),
          durationMins: duration,
          sessionType,
          notes,
          tenantId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Booking failed.");
      } else {
        setSuccess(`Session booked with ${selectedTrainer.name}! Waiting for confirmation.`);
        setShowForm(false);
        setDate("");
        setTime("");
        setCustomTime("");
        setNotes("");
        setSelectedTrainer(null);
        router.refresh();
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">Available Trainers</h2>
          {selectedTrainer && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {showForm ? "Cancel" : `Book ${selectedTrainer.name}`}
            </button>
          )}
        </div>

        {trainers.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No trainers available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trainers.map((t) => {
              const trainerHasAvailability = Object.values(t.availability ?? {}).some(
                (slots) => Array.isArray(slots) && slots.length > 0
              );
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTrainer(t);
                    setShowForm(true);
                    setDate("");
                    setTime("");
                    setCustomTime("");
                  }}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    selectedTrainer?.id === t.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold uppercase">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      {t.hourlyRate && (
                        <p className="text-xs text-gray-500">₦{t.hourlyRate.toLocaleString()}/hr</p>
                      )}
                    </div>
                  </div>
                  {t.bio && <p className="text-xs text-gray-500 italic mb-2">{t.bio}</p>}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.specialties.map((s) => (
                      <span key={s} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                  {!trainerHasAvailability && (
                    <p className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      ⚠️ Schedule not set — you can still request a time
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showForm && selectedTrainer && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Book Session with {selectedTrainer.name}
          </h2>

          {!hasAvailability && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              ℹ️ This trainer has not set their weekly schedule yet. You can still send a booking request with your preferred date and time — they will confirm or suggest a different time.
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => { setDate(e.target.value); setTime(""); setCustomTime(""); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {date && selectedDay && (
                <p className="text-xs text-gray-400 mt-1">{selectedDay}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
              {availableSlots.length > 0 ? (
                <>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select available slot --</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  <p className="text-xs text-green-600 mt-1">
                    ✅ {availableSlots.length} slot{availableSlots.length !== 1 ? "s" : ""} available on {selectedDay}
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {date && selectedDay && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ No preset slots for {selectedDay} — enter your preferred time
                    </p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. I want to focus on upper body strength..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {selectedTrainer.hourlyRate && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <span className="text-gray-500">Estimated cost: </span>
              <span className="font-semibold text-gray-900">
                ₦{((selectedTrainer.hourlyRate / 60) * duration).toLocaleString()}
              </span>
              <span className="text-gray-400"> ({duration} min)</span>
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition"
          >
            {loading ? "Booking..." : "Confirm Booking Request"}
          </button>
        </div>
      )}
    </div>
  );
}
