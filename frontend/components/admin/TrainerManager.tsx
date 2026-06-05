"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Trainer {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  bio: string;
  hourlyRate: number | null;
  totalBookings: number;
  hasProfile: boolean;
}

interface Props {
  tenantId: string;
  trainers: Trainer[];
}

export default function TrainerManager({ tenantId, trainers: initialTrainers }: Props) {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [showPromote, setShowPromote] = useState(false);
  const [email, setEmail] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePromote = async () => {
    setError("");
    setSuccess("");
    if (!email) { setError("Email is required."); return; }
    setLoading(true);
    try {
      // First find the user by email via the existing users debug endpoint won't work in prod
      // We need to promote by email — find user first
      const searchRes = await fetch(`/api/admin/find-user?email=${encodeURIComponent(email)}&secret=${encodeURIComponent("")}`);

      // Use promote endpoint logic
      const res = await fetch("/api/admin/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
          bio,
          hourlyRate: hourlyRate || null,
          tenantId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to promote trainer.");
      } else {
        setSuccess(`${email} has been promoted to Trainer!`);
        setEmail("");
        setSpecialties("");
        setBio("");
        setHourlyRate("");
        setShowPromote(false);
        router.refresh();
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Promote form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">Add Trainer</h2>
          <button
            onClick={() => setShowPromote(!showPromote)}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            {showPromote ? "Cancel" : "+ Add Trainer"}
          </button>
        </div>

        {showPromote && (
          <div className="space-y-4 pt-2">
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Member Email (to promote)</label>
                <input
                  type="email"
                  placeholder="trainer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hourly Rate (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Weight Training, Cardio, Yoga"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                <input
                  type="text"
                  placeholder="Short trainer bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handlePromote}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
            >
              {loading ? "Promoting..." : "Promote to Trainer"}
            </button>
          </div>
        )}
      </div>

      {/* Trainers list */}
      {trainers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="font-medium">No trainers yet</p>
          <p className="text-sm mt-1">Promote existing members to trainer role above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trainers.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-bold uppercase">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.email}</p>
                </div>
              </div>
              {t.bio && <p className="text-sm text-gray-500 mb-3 italic">{t.bio}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {t.specialties.map((s) => (
                  <span key={s} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>₦{t.hourlyRate?.toLocaleString() ?? "—"}/hr</span>
                <span>{t.totalBookings} booking{t.totalBookings !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
