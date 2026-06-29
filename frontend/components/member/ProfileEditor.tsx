"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GOAL_OPTIONS = [
  "Weight Loss",
  "Muscle Gain",
  "Improve Endurance",
  "Flexibility",
  "General Fitness",
  "Stress Relief",
  "Sports Performance",
  "Body Toning",
];

interface Props {
  userId: string;
  initialData: {
    name: string;
    email: string;
    weightKg: number | null;
    heightCm: number | null;
    fitnessGoals: string[];
  };
}

export default function ProfileEditor({ userId, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData.name,
    weightKg: initialData.weightKg?.toString() ?? "",
    heightCm: initialData.heightCm?.toString() ?? "",
    fitnessGoals: initialData.fitnessGoals,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const toggleGoal = (goal: string) => {
    setForm((prev) => ({
      ...prev,
      fitnessGoals: prev.fitnessGoals.includes(goal)
        ? prev.fitnessGoals.filter((g) => g !== goal)
        : [...prev.fitnessGoals, goal],
    }));
  };

  // BMI calculation
  const bmi =
    form.weightKg && form.heightCm
      ? (parseFloat(form.weightKg) / Math.pow(parseFloat(form.heightCm) / 100, 2)).toFixed(1)
      : null;

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5
      ? { label: "Underweight", color: "text-blue-600" }
      : parseFloat(bmi) < 25
      ? { label: "Normal", color: "text-green-600" }
      : parseFloat(bmi) < 30
      ? { label: "Overweight", color: "text-yellow-600" }
      : { label: "Obese", color: "text-red-600" }
    : null;

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save.");
      } else {
        setSuccess("Profile updated successfully!");
        router.refresh();
        setTimeout(() => setSuccess(""), 3000);
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Personal Info */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              value={initialData.email}
              disabled
              className="w-full border border-border bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Body Stats */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Body Measurements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 75"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Height (cm)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 175"
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        {bmi && bmiCategory && (
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Your BMI</p>
              <p className="text-2xl font-bold text-foreground">{bmi}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className={`text-lg font-semibold ${bmiCategory.color}`}>{bmiCategory.label}</p>
            </div>
          </div>
        )}
      </div>

      {/* Fitness Goals */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Fitness Goals</h2>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((goal) => {
            const selected = form.fitnessGoals.includes(goal);
            return (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  selected
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-card text-card-foreground text-muted-foreground border-border hover:border-indigo-400"
                }`}
              >
                {selected ? "✓ " : ""}{goal}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
