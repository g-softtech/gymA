"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
}

interface Routine {
  day: string;
  exercises: { name: string; sets: number; reps: string; rest: string }[];
}

interface WorkoutPlan {
  id: string;
  title: string;
  memberId: string;
  memberName: string;
  routines: Routine[];
  isAiGenerated: boolean;
  createdAt: string;
}

interface Props {
  trainerId: string;
  clients: Client[];
  initialPlans: WorkoutPlan[];
  filterMemberId?: string;
}

const defaultRoutine: Routine = {
  day: "Monday",
  exercises: [{ name: "", sets: 3, reps: "10", rest: "60s" }],
};

export default function WorkoutPlanManager({ trainerId, clients, initialPlans, filterMemberId }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>(initialPlans);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(filterMemberId ?? "");
  const [title, setTitle] = useState("");
  const [routines, setRoutines] = useState<Routine[]>([{ ...defaultRoutine }]);

  const addRoutine = () => {
    setRoutines([...routines, { day: "Tuesday", exercises: [{ name: "", sets: 3, reps: "10", rest: "60s" }] }]);
  };

  const removeRoutine = (i: number) => {
    setRoutines(routines.filter((_, idx) => idx !== i));
  };

  const updateRoutineDay = (i: number, day: string) => {
    const updated = [...routines];
    updated[i].day = day;
    setRoutines(updated);
  };

  const addExercise = (routineIdx: number) => {
    const updated = [...routines];
    updated[routineIdx].exercises.push({ name: "", sets: 3, reps: "10", rest: "60s" });
    setRoutines(updated);
  };

  const updateExercise = (rIdx: number, eIdx: number, field: string, value: string | number) => {
    const updated = [...routines];
    (updated[rIdx].exercises[eIdx] as any)[field] = value;
    setRoutines(updated);
  };

  const removeExercise = (rIdx: number, eIdx: number) => {
    const updated = [...routines];
    updated[rIdx].exercises = updated[rIdx].exercises.filter((_, i) => i !== eIdx);
    setRoutines(updated);
  };

  const handleCreate = async () => {
    setError("");
    if (!selectedMember) { setError("Please select a client."); return; }
    if (!title) { setError("Please enter a plan title."); return; }
    if (routines.some((r) => r.exercises.some((e) => !e.name))) {
      setError("Please fill in all exercise names."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trainer/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember, title, routines }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create plan.");
      } else {
        const newPlan = await res.json();
        const memberName = clients.find((c) => c.id === selectedMember)?.name ?? "Unknown";
        setPlans((prev) => [{ ...newPlan, memberName, routines }, ...prev]);
        setShowForm(false);
        setTitle("");
        setSelectedMember(filterMemberId ?? "");
        setRoutines([{ ...defaultRoutine }]);
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Delete this workout plan?")) return;
    const res = await fetch(`/api/trainer/workouts?planId=${planId}`, { method: "DELETE" });
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      router.refresh();
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
        >
          {showForm ? "Cancel" : "+ Create Workout Plan"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">New Workout Plan</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Client</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Plan Title</label>
              <input
                type="text"
                placeholder="e.g. 4-Week Strength Program"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Routines */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">Training Days</h3>
              <button onClick={addRoutine} className="text-sm text-indigo-600 hover:underline">+ Add Day</button>
            </div>

            {routines.map((routine, rIdx) => (
              <div key={rIdx} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <select
                    value={routine.day}
                    onChange={(e) => updateRoutineDay(rIdx, e.target.value)}
                    className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {days.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {routines.length > 1 && (
                    <button onClick={() => removeRoutine(rIdx)} className="text-xs text-red-500 hover:underline">Remove day</button>
                  )}
                </div>

                <div className="space-y-2">
                  {routine.exercises.map((ex, eIdx) => (
                    <div key={eIdx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Exercise name"
                        value={ex.name}
                        onChange={(e) => updateExercise(rIdx, eIdx, "name", e.target.value)}
                        className="col-span-4 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <input
                        type="number"
                        placeholder="Sets"
                        value={ex.sets}
                        onChange={(e) => updateExercise(rIdx, eIdx, "sets", parseInt(e.target.value))}
                        className="col-span-2 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <input
                        type="text"
                        placeholder="Reps"
                        value={ex.reps}
                        onChange={(e) => updateExercise(rIdx, eIdx, "reps", e.target.value)}
                        className="col-span-2 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <input
                        type="text"
                        placeholder="Rest"
                        value={ex.rest}
                        onChange={(e) => updateExercise(rIdx, eIdx, "rest", e.target.value)}
                        className="col-span-3 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      {routine.exercises.length > 1 && (
                        <button onClick={() => removeExercise(rIdx, eIdx)} className="col-span-1 text-red-400 hover:text-red-600 text-lg">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addExercise(rIdx)} className="text-xs text-indigo-600 hover:underline mt-1">+ Add exercise</button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
          >
            {loading ? "Saving..." : "Save Workout Plan"}
          </button>
        </div>
      )}

      {/* Plans list */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="bg-card text-card-foreground rounded-xl border border-border p-12 text-center text-muted-foreground">
            <p className="text-4xl mb-3">💪</p>
            <p className="font-medium">No workout plans yet</p>
            <p className="text-sm mt-1">Create a plan for your clients above</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground">For: {plan.memberName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {new Date(plan.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                    {plan.isAiGenerated && <span className="ml-2 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs">AI Generated</span>}
                  </p>
                </div>
                <button onClick={() => handleDelete(plan.id)} className="text-sm text-red-500 hover:underline">Delete</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(plan.routines || []).map((r, i) => (
                  <div key={i} className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-semibold text-indigo-600 mb-2">{r?.day || "Day"}</p>
                    <ul className="space-y-1">
                      {(r?.exercises || []).map((ex, j) => (
                        <li key={j} className="text-xs text-muted-foreground">
                          {ex?.name} — {ex?.sets}×{ex?.reps} ({ex?.rest} rest)
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
