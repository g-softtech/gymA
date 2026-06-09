"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MemberData {
  weightKg: number | null;
  heightCm: number | null;
  fitnessGoals: string[];
  latestWeight: number | null;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

interface DayPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  title: string;
  weeklyPlan: DayPlan[];
  tips: string[];
}

const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const DAYS_OPTIONS = [3, 4, 5, 6];
const FOCUS_AREAS = ["Full Body", "Upper Body", "Lower Body", "Core", "Cardio & Strength", "Weight Loss", "Muscle Gain"];
const EQUIPMENT_OPTIONS = ["Full gym equipment", "Dumbbells only", "Barbells & dumbbells", "Resistance bands", "Bodyweight only", "Machines only"];

export default function AIWorkoutGenerator({ memberId, memberData }: { memberId: string; memberData: MemberData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fitnessLevel: "Intermediate",
    daysPerWeek: 4,
    equipment: "Full gym equipment",
    focusArea: "Full Body",
    goals: memberData.fitnessGoals.join(", ") || "general fitness and strength",
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to generate plan.");
      } else {
        const data = await res.json();
        setPlan(data);
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Config form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Tell the AI about yourself</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fitness Level</label>
            <select value={form.fitnessLevel} onChange={(e) => setForm({ ...form, fitnessLevel: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {FITNESS_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Days per Week</label>
            <select value={form.daysPerWeek} onChange={(e) => setForm({ ...form, daysPerWeek: parseInt(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {DAYS_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Focus Area</label>
            <select value={form.focusArea} onChange={(e) => setForm({ ...form, focusArea: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {FOCUS_AREAS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Available Equipment</label>
            <select value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {EQUIPMENT_OPTIONS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Your Goals</label>
          <input type="text" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })}
            placeholder="e.g. lose weight, build muscle, improve endurance"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating your plan...
            </>
          ) : "🤖 Generate AI Workout Plan"}
        </button>
      </div>

      {/* Generated plan */}
      {plan && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">{plan.title}</p>
              <p className="text-sm text-green-600">
                {saved ? "Saved to your workout plans automatically!" : ""}
              </p>
            </div>
          </div>

          {/* Weekly plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plan.weeklyPlan.map((day, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-indigo-600">{day.day}</p>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{day.focus}</span>
                </div>
                <div className="space-y-2">
                  {day.exercises.map((ex, j) => (
                    <div key={j} className="text-sm">
                      <p className="font-medium text-gray-900">{ex.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ex.sets} sets &times; {ex.reps} reps &middot; {ex.rest} rest
                        {ex.notes && <span className="text-indigo-500 ml-1">· {ex.notes}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {plan.tips.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-semibold text-blue-800 mb-3">💡 Coach Tips</h3>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-blue-700 flex gap-2">
                    <span className="shrink-0">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading}
            className="w-full border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-semibold py-2.5 rounded-xl text-sm transition">
            🔄 Generate Another Plan
          </button>
        </div>
      )}
    </div>
  );
}
