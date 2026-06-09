"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MemberData {
  weightKg: number | null;
  heightCm: number | null;
  fitnessGoals: string[];
}

interface Food {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  name: string;
  time: string;
  foods: Food[];
}

interface NutritionPlan {
  title: string;
  totalCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: Meal[];
  tips: string[];
  substitutions: { original: string; alternative: string; reason: string }[];
  targetCalories: number;
  tdee: number;
}

const GOALS = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "GENERAL_HEALTH", label: "General Health" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (desk job, no exercise)" },
  { value: "light", label: "Light (1-3 days/week)" },
  { value: "moderate", label: "Moderate (3-5 days/week)" },
  { value: "active", label: "Active (6-7 days/week)" },
  { value: "very_active", label: "Very Active (twice daily)" },
];

export default function AINutritionCoach({ memberId, memberData }: { memberId: string; memberData: MemberData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    goal: "GENERAL_HEALTH",
    activityLevel: "moderate",
    allergies: "",
    preferences: "Nigerian foods preferred",
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          weightKg: memberData.weightKg,
          heightCm: memberData.heightCm,
          ...form,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to generate plan.");
      } else {
        const data = await res.json();
        setPlan(data);
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Personalise your meal plan</h2>

        {(!memberData.weightKg || !memberData.heightCm) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ Add your weight and height in My Profile for more accurate calorie calculations.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Diet Goal</label>
            <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Activity Level</label>
            <select value={form.activityLevel} onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {ACTIVITY_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Allergies / Restrictions</label>
            <input type="text" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              placeholder="e.g. peanut allergy, no pork"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Food Preferences</label>
            <input type="text" value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })}
              placeholder="e.g. Nigerian foods, vegetarian"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating your Nigerian meal plan...
            </>
          ) : "🥗 Generate AI Meal Plan"}
        </button>
      </div>

      {plan && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-800">{plan.title}</p>
            <p className="text-sm text-green-600 mt-1">Saved to your meal plans! ✅</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-orange-600 font-bold">{plan.totalCalories} kcal</span>
              <span className="text-blue-600">Protein: {plan.protein}g</span>
              <span className="text-yellow-600">Carbs: {plan.carbs}g</span>
              <span className="text-red-600">Fats: {plan.fats}g</span>
            </div>
          </div>

          {plan.meals.map((meal, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-gray-900">{meal.name}</p>
                <p className="text-xs text-gray-400">{meal.time}</p>
              </div>
              <div className="space-y-2">
                {meal.foods.map((food, j) => (
                  <div key={j} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-800">{food.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">{food.quantity}</span>
                    </div>
                    <span className="text-orange-600 font-medium text-xs">{food.calories} kcal</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-3 text-xs text-gray-400">
                <span>P: {meal.foods.reduce((s, f) => s + f.protein, 0).toFixed(1)}g</span>
                <span>C: {meal.foods.reduce((s, f) => s + f.carbs, 0).toFixed(1)}g</span>
                <span>F: {meal.foods.reduce((s, f) => s + f.fats, 0).toFixed(1)}g</span>
              </div>
            </div>
          ))}

          {plan.tips?.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-semibold text-blue-800 mb-3">💡 Nutrition Tips</h3>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-blue-700 flex gap-2"><span>•</span>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.substitutions?.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-700 mb-3">🔄 Food Substitutions</h3>
              <div className="space-y-2">
                {plan.substitutions.map((s, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-gray-800">{s.original}</span>
                    <span className="text-gray-400 mx-2">→</span>
                    <span className="font-medium text-green-700">{s.alternative}</span>
                    <span className="text-gray-400 ml-2 text-xs">({s.reason})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading}
            className="w-full border-2 border-green-300 text-green-600 hover:bg-green-50 font-semibold py-2.5 rounded-xl text-sm transition">
            🔄 Generate Another Plan
          </button>
        </div>
      )}
    </div>
  );
}
