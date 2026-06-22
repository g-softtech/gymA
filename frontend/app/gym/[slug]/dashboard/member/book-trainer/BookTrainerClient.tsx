"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";

interface Trainer {
  id: string; // User ID
  name: string;
  email: string;
  profileId: string;
  specialties: string[];
  bio: string | null;
  hourlyRate: number;
  title: string | null;
  yearsOfExperience: number | null;
  publicPhotoUrl: string | null;
}

interface Props {
  tenantId: string;
  memberId: string;
  trainers: Trainer[];
}

export default function BookTrainerClient({ tenantId, memberId, trainers }: Props) {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Generate the next 14 days for selection
  const days = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

  // Mock available time slots (since we don't have a schedule engine yet)
  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const handleBook = async () => {
    if (!selectedTrainer || !selectedTime) return;
    
    setLoading(true);
    setError("");
    setSuccess(false);

    // Construct the requested date/time
    const [time, ampm] = selectedTime.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes, 0, 0);

    try {
      const res = await fetch("/api/member/book-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: selectedTrainer.profileId, // the TrainerProfile ID
          date: bookingDate.toISOString(),
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to book session");

      setSuccess(true);
      setSelectedTime(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-green-100 text-center shadow-sm max-w-2xl mx-auto mt-12">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Requested!</h2>
        <p className="text-gray-500 mb-8">
          Your session with {selectedTrainer?.name} on {format(selectedDate, "MMMM do, yyyy")} at {selectedTime} has been submitted and is currently <span className="font-bold text-yellow-600">PENDING</span> approval.
        </p>
        <button 
          onClick={() => { setSuccess(false); setSelectedTrainer(null); }}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          Book Another Session
        </button>
      </div>
    );
  }

  if (selectedTrainer) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
          <button 
            onClick={() => { setSelectedTrainer(null); setError(""); }}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            &larr; Back
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 overflow-hidden">
            {selectedTrainer.publicPhotoUrl ? (
              <img src={selectedTrainer.publicPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : selectedTrainer.name[0]}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{selectedTrainer.name}</h2>
            <p className="text-sm text-gray-500">{selectedTrainer.title || "Personal Trainer"}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Calendar Selector */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Select Date</h3>
            <div className="grid grid-cols-7 gap-2">
              {days.map((d) => {
                const isSelected = format(d, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null); setError(""); }}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition ${
                      isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">{format(d, "EEE")}</span>
                    <span className="text-lg font-black">{format(d, "d")}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
              Available Times on {format(selectedDate, "MMM do")}
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {timeSlots.map(time => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => { setSelectedTime(time); setError(""); }}
                    className={`py-2 px-1 text-sm font-semibold rounded-lg border transition ${
                      isSelected ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600" : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    {time}
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">
                🚨 {error}
              </div>
            )}

            <button
              disabled={!selectedTime || loading}
              onClick={handleBook}
              className="w-full mt-8 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Requesting Booking..." : `Request Session (₦${selectedTrainer.hourlyRate})`}
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">
              Sessions require trainer approval. Standard 1-hour duration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainers.length === 0 ? (
        <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
          No trainers are currently available to book.
        </div>
      ) : (
        trainers.map((trainer) => (
          <div key={trainer.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="aspect-video bg-gray-100 relative">
              {trainer.publicPhotoUrl ? (
                <img src={trainer.publicPhotoUrl} alt={trainer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              )}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                ₦{trainer.hourlyRate}/hr
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900">{trainer.name}</h3>
              <p className="text-sm text-indigo-600 font-medium mb-3">{trainer.title || "Personal Trainer"}</p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {trainer.specialties.map(spec => (
                  <span key={spec} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
                    {spec}
                  </span>
                ))}
              </div>
              
              <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                {trainer.bio || "No bio provided."}
              </p>
              
              <button 
                onClick={() => setSelectedTrainer(trainer)}
                className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition"
              >
                View Availability
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
