"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function PublicBookingClient({ 
  tenantId, 
  slug, 
  classes, 
  trainers, 
  brandColor 
}: { 
  tenantId: string, 
  slug: string, 
  classes: any[], 
  trainers: any[], 
  brandColor: string 
}) {
  const [tab, setTab] = useState<"classes" | "trainers">("classes");
  
  // Trainer Booking State
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);

  const handleBookClass = async (classSessionId: string) => {
    const toastId = toast.loading("Booking class...");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classSessionId }),
      });
      const data = await res.json();
      
      if (res.status === 401) {
        toast.error("Please sign in to book a class", { id: toastId });
        window.location.href = `/api/auth/signin?callbackUrl=/gym/${slug}/book`;
        return;
      }

      if (res.ok) {
        toast.success("Class booked successfully!", { id: toastId });
        setTimeout(() => window.location.href = `/gym/${slug}/dashboard/member`, 1500);
      } else {
        toast.error(data.error || "Failed to book", { id: toastId });
      }
    } catch (error) {
      toast.error("Network error", { id: toastId });
    }
  };

  const fetchSlots = async (trainerId: string, date: string) => {
    if (!trainerId || !date) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/gym/${slug}/slots?trainerId=${trainerId}&date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots(data.availableSlots || []);
      } else {
        toast.error(data.error || "Failed to load slots");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookTrainer = async (slotTimeStr: string) => {
    if (!selectedTrainer) return;
    setBookingSlot(slotTimeStr);
    const toastId = toast.loading("Booking session...");
    
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId: selectedTrainer, date: slotTimeStr }),
      });
      const data = await res.json();
      
      if (res.status === 401) {
        toast.error("Please sign in to book a session", { id: toastId });
        window.location.href = `/api/auth/signin?callbackUrl=/gym/${slug}/book`;
        return;
      }

      if (res.ok) {
        toast.success("Session booked! Awaiting confirmation.", { id: toastId });
        setTimeout(() => window.location.href = `/gym/${slug}/dashboard/member`, 1500);
      } else {
        toast.error(data.error || "Failed to book", { id: toastId });
      }
    } catch (error) {
      toast.error("Network error", { id: toastId });
    } finally {
      setBookingSlot(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#11111a] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="flex border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setTab("classes")}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            tab === "classes" 
            ? "text-white bg-slate-900 dark:bg-slate-800" 
            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          Group Classes
        </button>
        <button
          onClick={() => setTab("trainers")}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            tab === "trainers" 
            ? "text-white bg-slate-900 dark:bg-slate-800" 
            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          1-on-1 Trainers
        </button>
      </div>

      <div className="p-6">
        {tab === "classes" && (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                No upcoming classes found.
              </div>
            ) : (
              classes.map(cls => {
                const isFull = cls._count.bookings >= cls.capacity;
                const spotsLeft = cls.capacity - cls._count.bookings;
                
                return (
                  <div key={cls.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-5 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{cls.title}</h3>
                        <p className="text-sm text-slate-500">{new Date(cls.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isFull ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {isFull ? "FULL" : `${spotsLeft} spots left`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                        {cls.instructor?.user?.image ? (
                          <img src={cls.instructor.user.image} alt="Instructor" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{cls.instructor?.user?.name?.[0] || "?"}</span>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="text-slate-900 dark:text-white font-medium">{cls.instructor?.user?.name || "Unassigned"}</p>
                        <p className="text-slate-500 text-xs">{cls.durationMins} mins</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookClass(cls.id)}
                      disabled={isFull}
                      style={!isFull ? { backgroundColor: brandColor, color: '#fff' } : {}}
                      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${
                        isFull ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed" : ""
                      }`}
                    >
                      {isFull ? "Class Full" : "Book Class"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "trainers" && (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">1. Select a Trainer</h3>
              {trainers.length === 0 ? (
                <p className="text-slate-500">No trainers available.</p>
              ) : (
                trainers.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => {
                      setSelectedTrainer(t.id);
                      if (selectedDate) fetchSlots(t.id, selectedDate);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      selectedTrainer === t.id 
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                      : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      {t.publicPhotoUrl || t.user?.image ? (
                        <img src={t.publicPhotoUrl || t.user?.image} alt="Trainer" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{t.user?.name}</h4>
                      <p className="text-sm text-slate-500">{t.title || "Personal Trainer"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">2. Select a Date</h3>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (selectedTrainer) fetchSlots(selectedTrainer, e.target.value);
                }}
                disabled={!selectedTrainer}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
              />

              {selectedDate && selectedTrainer && (
                <div className="pt-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">3. Available Slots</h3>
                  {loadingSlots ? (
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-slate-500">No available slots on this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot, idx) => {
                        const dateObj = new Date(slot);
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <button
                            key={idx}
                            onClick={() => handleBookTrainer(slot)}
                            disabled={bookingSlot === slot}
                            className="py-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                          >
                            {bookingSlot === slot ? "..." : timeStr}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
