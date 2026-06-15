"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function BookingManager() {
  const [activeTab, setActiveTab] = useState("classes");
  const [classes, setClasses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructorId: "",
    startTime: "",
    durationMins: 60,
    capacity: 20,
    recurrenceWeeks: 1,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resClasses, resBookings, resTrainers] = await Promise.all([
        fetch("/api/admin/classes").then(r => r.json()),
        fetch("/api/bookings").then(r => r.json()),
        fetch("/api/admin/trainers").then(r => r.json())
      ]);

      if (!resClasses.error) setClasses(resClasses);
      if (!resBookings.error) setBookings(resBookings.bookings || []);
      if (!resTrainers.error) setTrainers(resTrainers || []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Creating class(es)...");
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Class created!", { id: loadingToast });
        setShowClassModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to create", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Network error", { id: loadingToast });
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure? This will cancel all bookings for this specific class session.")) return;
    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Class deleted");
        fetchData();
      } else {
        toast.error("Failed to delete class");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Booking ${status.toLowerCase()}`);
        fetchData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 dark:bg-white/5 rounded-xl"></div>;
  }

  const trainerBookings = bookings.filter(b => b.trainerId);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "classes"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Group Classes
        </button>
        <button
          onClick={() => setActiveTab("trainers")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "trainers"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          1-on-1 Sessions
        </button>
      </div>

      {/* Classes Tab */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowClassModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Schedule Class
            </button>
          </div>

          <div className="bg-white dark:bg-[#11111a] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-white/5">
              {classes.length === 0 ? (
                <p className="p-6 text-center text-slate-500">No upcoming classes scheduled.</p>
              ) : (
                classes.map((cls) => {
                  const isFull = cls._count.bookings >= cls.capacity;
                  return (
                    <div key={cls.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">{cls.title}</h4>
                          <p className="text-sm text-slate-500">{new Date(cls.startTime).toLocaleString()}</p>
                          <p className="text-sm text-slate-500 mt-1">Instructor: {cls.instructor?.user?.name || "Unassigned"}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isFull ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {cls._count.bookings} / {cls.capacity}
                        </span>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/5">
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium w-full text-center py-2 bg-red-50 dark:bg-red-900/10 rounded-lg"
                        >
                          Cancel Class
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Tablet/Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Class Name</th>
                    <th className="px-6 py-3 font-medium">Date & Time</th>
                    <th className="px-6 py-3 font-medium">Instructor</th>
                    <th className="px-6 py-3 font-medium">Booked</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No upcoming classes scheduled.
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => {
                      const isFull = cls._count.bookings >= cls.capacity;
                      return (
                        <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            {cls.title}
                            <div className="text-xs text-slate-500 font-normal">{cls.durationMins} mins</div>
                          </td>
                          <td className="px-6 py-4">
                            {new Date(cls.startTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {cls.instructor?.user?.name || "Unassigned"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isFull ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                              {cls._count.bookings} / {cls.capacity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteClass(cls.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Cancel Class
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trainers Tab */}
      {activeTab === "trainers" && (
        <div className="bg-white dark:bg-[#11111a] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-white/5">
            {trainerBookings.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No 1-on-1 bookings found.</p>
            ) : (
              trainerBookings.map((b) => (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-lg">{b.member?.user?.name}</div>
                      <div className="text-sm text-slate-500">{new Date(b.date).toLocaleString()}</div>
                      <div className="text-sm text-slate-500 mt-1">Trainer: {b.trainer?.user?.name}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      b.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    {b.status === "PENDING" && (
                      <button
                        onClick={() => handleUpdateBookingStatus(b.id, "CONFIRMED")}
                        className="flex-1 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 py-2 rounded-lg text-sm font-medium"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleUpdateBookingStatus(b.id, "CANCELLED")}
                        className="flex-1 bg-red-50 dark:bg-red-900/10 text-red-500 hover:text-red-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tablet/Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-6 py-3 font-medium">Trainer</th>
                  <th className="px-6 py-3 font-medium">Date & Time</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {trainerBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No 1-on-1 bookings found.
                    </td>
                  </tr>
                ) : (
                  trainerBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{b.member?.user?.name}</div>
                        <div className="text-xs text-slate-500">{b.member?.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {b.trainer?.user?.name}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(b.date).toLocaleString()}
                        <div className="text-xs text-slate-500">{b.durationMins} mins</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          b.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        {b.status === "PENDING" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, "CONFIRMED")}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                          >
                            Confirm
                          </button>
                        )}
                        {b.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, "CANCELLED")}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Creation Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Class</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. HIIT Bootcamp"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    required
                    value={formData.durationMins}
                    onChange={e => setFormData({ ...formData, durationMins: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Repeat (Weeks)</label>
                  <select
                    value={formData.recurrenceWeeks}
                    onChange={e => setFormData({ ...formData, recurrenceWeeks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>Don't repeat</option>
                    <option value={4}>4 Weeks</option>
                    <option value={8}>8 Weeks</option>
                    <option value={12}>12 Weeks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instructor</label>
                <select
                  value={formData.instructorId}
                  onChange={e => setFormData({ ...formData, instructorId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.user?.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
