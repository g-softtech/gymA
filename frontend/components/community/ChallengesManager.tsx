"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ChallengeEntry {
  userId: string;
  userName: string;
  progress: number;
  completed: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  goal: number;
  unit: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  entries: ChallengeEntry[];
  myEntry: ChallengeEntry | null;
}

interface Props {
  tenantId: string;
  currentUserId: string;
  isAdmin: boolean;
  challenges: Challenge[];
}

const CHALLENGE_TYPES = [
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "WORKOUT", label: "Workout" },
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "STEPS", label: "Steps" },
  { value: "CUSTOM", label: "Custom" },
];

export default function ChallengesManager({ tenantId, currentUserId, isAdmin, challenges: initialChallenges }: Props) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "CUSTOM",
    goal: "",
    unit: "",
    startDate: "",
    endDate: "",
  });

  const handleCreate = async () => {
    setError("");
    if (!form.title || !form.goal || !form.unit || !form.startDate || !form.endDate) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/community/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create challenge.");
      } else {
        setShowForm(false);
        setForm({ title: "", description: "", type: "CUSTOM", goal: "", unit: "", startDate: "", endDate: "" });
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrUpdate = async (challengeId: string) => {
    const progress = parseInt(progressInputs[challengeId] ?? "0");
    setUpdatingId(challengeId);
    try {
      const res = await fetch(`/api/community/challenges/${challengeId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
      if (res.ok) {
        setChallenges((prev) =>
          prev.map((c) => {
            if (c.id !== challengeId) return c;
            const completed = progress >= c.goal;
            const existingEntry = c.entries.find((e) => e.userId === currentUserId);
            const updatedEntries = existingEntry
              ? c.entries.map((e) => e.userId === currentUserId ? { ...e, progress, completed } : e)
              : [...c.entries, { userId: currentUserId, userName: "You", progress, completed }];
            return { ...c, entries: updatedEntries, myEntry: { userId: currentUserId, userName: "You", progress, completed } };
          })
        );
        setProgressInputs((prev) => ({ ...prev, [challengeId]: "" }));
        router.refresh();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const active = challenges.filter((c) => c.isActive);
  const upcoming = challenges.filter((c) => new Date(c.startDate) > new Date());
  const past = challenges.filter((c) => new Date(c.endDate) < new Date());

  const renderChallenge = (c: Challenge) => {
    const pct = c.myEntry ? Math.min(100, Math.round((c.myEntry.progress / c.goal) * 100)) : 0;
    const top3 = [...c.entries].sort((a, b) => b.progress - a.progress).slice(0, 3);

    return (
      <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{c.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                c.isActive ? "bg-green-100 text-green-700" :
                new Date(c.startDate) > new Date() ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-500"
              }`}>
                {c.isActive ? "Active" : new Date(c.startDate) > new Date() ? "Upcoming" : "Ended"}
              </span>
            </div>
            {c.description && <p className="text-sm text-gray-500 mt-1">{c.description}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Goal: <span className="font-medium text-gray-600">{c.goal} {c.unit}</span>
              {" · "}
              {new Date(c.startDate).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
              {" — "}
              {new Date(c.endDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <span className="text-2xl">
            {c.type === "ATTENDANCE" ? "📅" : c.type === "WORKOUT" ? "💪" : c.type === "WEIGHT_LOSS" ? "⚖️" : c.type === "STEPS" ? "👟" : "🏆"}
          </span>
        </div>

        {/* My progress */}
        {c.myEntry && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>My progress</span>
              <span>{c.myEntry.progress} / {c.goal} {c.unit}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${c.myEntry.completed ? "bg-green-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {c.myEntry.completed && (
              <p className="text-xs text-green-600 font-medium mt-1">🏆 Challenge completed!</p>
            )}
          </div>
        )}

        {/* Update progress */}
        {c.isActive && (
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max={c.goal}
              placeholder={c.myEntry ? `Update (current: ${c.myEntry.progress})` : `Enter progress (0–${c.goal})`}
              value={progressInputs[c.id] ?? ""}
              onChange={(e) => setProgressInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleJoinOrUpdate(c.id)}
              disabled={updatingId === c.id || !progressInputs[c.id]}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              {updatingId === c.id ? "..." : c.myEntry ? "Update" : "Join"}
            </button>
          </div>
        )}

        {/* Top 3 */}
        {top3.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Top Participants</p>
            <div className="space-y-1">
              {top3.map((e, i) => (
                <div key={e.userId} className="flex items-center gap-2 text-sm">
                  <span className="text-xs">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <span className={`flex-1 font-medium ${e.userId === currentUserId ? "text-indigo-600" : "text-gray-700"}`}>
                    {e.userId === currentUserId ? "You" : e.userName}
                  </span>
                  <span className="text-gray-500 text-xs">{e.progress} {c.unit}</span>
                  {e.completed && <span className="text-green-500 text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Admin create form */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-900">Manage Challenges</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {showForm ? "Cancel" : "+ New Challenge"}
            </button>
          </div>

          {showForm && (
            <div className="space-y-4 pt-2">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. 30-Day Attendance Challenge"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {CHALLENGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Goal (number)</label>
                  <input type="number" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    placeholder="e.g. 20"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g. visits, workouts, kg"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the challenge..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleCreate} disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition">
                {loading ? "Creating..." : "Create Challenge"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active challenges */}
      {active.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-700">🔥 Active Challenges</h2>
          {active.map(renderChallenge)}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-700">📅 Upcoming</h2>
          {upcoming.map(renderChallenge)}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-700 opacity-60">Past Challenges</h2>
          {past.map(renderChallenge)}
        </div>
      )}

      {challenges.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium text-gray-600">No challenges yet</p>
          <p className="text-sm mt-1">
            {isAdmin ? "Create a challenge above to get members competing!" : "Check back soon — your admin will create challenges here."}
          </p>
        </div>
      )}
    </div>
  );
}
