"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Meal {
  name: string;
  time: string;
  foods: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }[];
}

interface MealPlan {
  id: string;
  title: string;
  goal: string;
  totalCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: Meal[];
  isAiGenerated: boolean;
  createdAt: string;
}

interface Props {
  memberId: string;
  weightKg: number | null;
  heightCm: number | null;
  fitnessGoals: string[];
  initialPlans: MealPlan[];
}

const GOALS = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "GENERAL_HEALTH", label: "General Health" },
];

function getTemplate(goal: string): MealPlan {
  const templates: Record<string, MealPlan> = {
    WEIGHT_LOSS: {
      id: "", title: "Nigerian Weight Loss Plan", goal: "WEIGHT_LOSS",
      totalCalories: 1500, protein: 120, carbs: 150, fats: 45,
      meals: [
        { name: "Breakfast", time: "7:00 AM", foods: [
          { name: "Ogi (Pap)", quantity: "1 cup", calories: 90, protein: 2, carbs: 20, fats: 0.5 },
          { name: "Moin Moin", quantity: "1 piece", calories: 120, protein: 8, carbs: 14, fats: 4 },
        ]},
        { name: "Lunch", time: "12:30 PM", foods: [
          { name: "Brown Rice", quantity: "half cup", calories: 110, protein: 2.5, carbs: 23, fats: 0.9 },
          { name: "Efo Riro", quantity: "1 bowl", calories: 180, protein: 12, carbs: 10, fats: 11 },
          { name: "Grilled Fish", quantity: "1 piece", calories: 150, protein: 28, carbs: 0, fats: 4 },
        ]},
        { name: "Snack", time: "3:30 PM", foods: [
          { name: "Groundnuts", quantity: "small handful", calories: 170, protein: 8, carbs: 5, fats: 15 },
        ]},
        { name: "Dinner", time: "7:00 PM", foods: [
          { name: "Pepper Soup", quantity: "1 bowl", calories: 140, protein: 18, carbs: 4, fats: 6 },
          { name: "Boiled Yam", quantity: "small", calories: 200, protein: 2.5, carbs: 47, fats: 0.1 },
        ]},
      ],
      isAiGenerated: false, createdAt: "",
    },
    MUSCLE_GAIN: {
      id: "", title: "Nigerian Muscle Building Plan", goal: "MUSCLE_GAIN",
      totalCalories: 2800, protein: 180, carbs: 340, fats: 75,
      meals: [
        { name: "Breakfast", time: "6:30 AM", foods: [
          { name: "Pounded Yam", quantity: "1 cup", calories: 210, protein: 2.5, carbs: 50, fats: 0.3 },
          { name: "Egusi Soup", quantity: "1 bowl", calories: 320, protein: 18, carbs: 8, fats: 24 },
          { name: "Boiled Eggs", quantity: "3 eggs", calories: 234, protein: 19, carbs: 1.8, fats: 16 },
        ]},
        { name: "Pre-workout", time: "11:00 AM", foods: [
          { name: "Banana", quantity: "2 medium", calories: 178, protein: 2.2, carbs: 46, fats: 0.6 },
          { name: "Groundnuts", quantity: "half cup", calories: 285, protein: 13, carbs: 8, fats: 25 },
        ]},
        { name: "Lunch", time: "1:30 PM", foods: [
          { name: "Jollof Rice", quantity: "2 cups", calories: 360, protein: 8, carbs: 72, fats: 6 },
          { name: "Fried Chicken", quantity: "2 pieces", calories: 370, protein: 40, carbs: 8, fats: 20 },
        ]},
        { name: "Post-workout", time: "5:30 PM", foods: [
          { name: "Moin Moin", quantity: "2 pieces", calories: 240, protein: 16, carbs: 28, fats: 8 },
        ]},
        { name: "Dinner", time: "8:00 PM", foods: [
          { name: "Beans Porridge", quantity: "1 cup", calories: 210, protein: 14, carbs: 38, fats: 1.5 },
          { name: "Fried Plantain", quantity: "half cup", calories: 120, protein: 0.75, carbs: 24, fats: 3 },
        ]},
      ],
      isAiGenerated: false, createdAt: "",
    },
    MAINTENANCE: {
      id: "", title: "Nigerian Maintenance Plan", goal: "MAINTENANCE",
      totalCalories: 2200, protein: 130, carbs: 275, fats: 70,
      meals: [
        { name: "Breakfast", time: "7:00 AM", foods: [
          { name: "Yam and Egg", quantity: "1 plate", calories: 280, protein: 10, carbs: 45, fats: 8 },
          { name: "Zobo Drink", quantity: "1 glass", calories: 40, protein: 0.5, carbs: 10, fats: 0 },
        ]},
        { name: "Lunch", time: "1:00 PM", foods: [
          { name: "Jollof Rice", quantity: "1 cup", calories: 180, protein: 4, carbs: 36, fats: 3 },
          { name: "Grilled Chicken", quantity: "1 piece", calories: 185, protein: 30, carbs: 0, fats: 7 },
          { name: "Ugwu", quantity: "1 cup", calories: 40, protein: 4, carbs: 5, fats: 0.5 },
        ]},
        { name: "Snack", time: "4:00 PM", foods: [
          { name: "Tiger Nut Milk", quantity: "1 glass", calories: 100, protein: 2, carbs: 20, fats: 3 },
        ]},
        { name: "Dinner", time: "7:30 PM", foods: [
          { name: "Okra Soup", quantity: "1 bowl", calories: 160, protein: 10, carbs: 12, fats: 9 },
          { name: "Eba", quantity: "half cup", calories: 180, protein: 0.75, carbs: 42.5, fats: 0.25 },
        ]},
      ],
      isAiGenerated: false, createdAt: "",
    },
    ENDURANCE: {
      id: "", title: "Nigerian Endurance Plan", goal: "ENDURANCE",
      totalCalories: 2500, protein: 110, carbs: 350, fats: 65,
      meals: [
        { name: "Breakfast", time: "6:00 AM", foods: [
          { name: "Ogi (Pap)", quantity: "2 cups", calories: 180, protein: 4, carbs: 40, fats: 1 },
          { name: "Akara", quantity: "3 pieces", calories: 540, protein: 27, carbs: 60, fats: 24 },
        ]},
        { name: "Pre-workout", time: "10:00 AM", foods: [
          { name: "Banana", quantity: "2 medium", calories: 178, protein: 2.2, carbs: 46, fats: 0.6 },
          { name: "Kunu", quantity: "1 glass", calories: 80, protein: 2, carbs: 18, fats: 1 },
        ]},
        { name: "Lunch", time: "1:00 PM", foods: [
          { name: "Pounded Yam", quantity: "1 cup", calories: 210, protein: 2.5, carbs: 50, fats: 0.3 },
          { name: "Egusi Soup", quantity: "1 bowl", calories: 320, protein: 18, carbs: 8, fats: 24 },
        ]},
        { name: "Dinner", time: "7:00 PM", foods: [
          { name: "Beans Porridge", quantity: "1 cup", calories: 210, protein: 14, carbs: 38, fats: 1.5 },
          { name: "Boiled Plantain", quantity: "1 cup", calories: 180, protein: 1.5, carbs: 47, fats: 0.3 },
        ]},
      ],
      isAiGenerated: false, createdAt: "",
    },
    GENERAL_HEALTH: {
      id: "", title: "Balanced Nigerian Diet Plan", goal: "GENERAL_HEALTH",
      totalCalories: 2000, protein: 100, carbs: 250, fats: 65,
      meals: [
        { name: "Breakfast", time: "7:00 AM", foods: [
          { name: "Yam and Egg", quantity: "1 plate", calories: 280, protein: 10, carbs: 45, fats: 8 },
          { name: "Zobo Drink", quantity: "1 glass", calories: 40, protein: 0.5, carbs: 10, fats: 0 },
        ]},
        { name: "Lunch", time: "1:00 PM", foods: [
          { name: "Jollof Rice", quantity: "1 cup", calories: 180, protein: 4, carbs: 36, fats: 3 },
          { name: "Grilled Chicken", quantity: "1 piece", calories: 185, protein: 30, carbs: 0, fats: 7 },
          { name: "Garden Egg Salad", quantity: "1 bowl", calories: 60, protein: 2, carbs: 10, fats: 2 },
        ]},
        { name: "Snack", time: "4:00 PM", foods: [
          { name: "Agbalumo", quantity: "2 pieces", calories: 110, protein: 1.2, carbs: 26, fats: 0.2 },
        ]},
        { name: "Dinner", time: "7:30 PM", foods: [
          { name: "Okra Soup", quantity: "1 bowl", calories: 160, protein: 10, carbs: 12, fats: 9 },
          { name: "Eba", quantity: "half cup", calories: 180, protein: 0.75, carbs: 42.5, fats: 0.25 },
        ]},
      ],
      isAiGenerated: false, createdAt: "",
    },
  };
  return templates[goal] ?? templates["GENERAL_HEALTH"];
}

export default function MealPlanManager({ memberId, weightKg, heightCm, fitnessGoals, initialPlans }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<MealPlan[]>(initialPlans);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("GENERAL_HEALTH");
  const [customTitle, setCustomTitle] = useState("");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const preview = getTemplate(selectedGoal);

  const handleCreate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/nutrition/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          title: customTitle || preview.title,
          goal: selectedGoal,
          totalCalories: preview.totalCalories,
          protein: preview.protein,
          carbs: preview.carbs,
          fats: preview.fats,
          meals: preview.meals,
          isAiGenerated: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create plan.");
      } else {
        const newPlan = await res.json();
        setPlans((prev) => [{ ...newPlan, meals: preview.meals }, ...prev]);
        setShowForm(false);
        setCustomTitle("");
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Delete this meal plan?")) return;
    const res = await fetch(`/api/nutrition/meal-plans?planId=${planId}`, { method: "DELETE" });
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
        >
          {showForm ? "Cancel" : "+ Create Meal Plan"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">New Meal Plan</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Diet Goal</label>
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Plan Title (optional)</label>
              <input
                type="text"
                placeholder={preview.title}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">Plan Preview</h3>
              <div className="flex gap-3 text-xs">
                <span className="text-orange-600 font-medium">{preview.totalCalories} kcal</span>
                <span className="text-blue-600">P: {preview.protein}g</span>
                <span className="text-yellow-600">C: {preview.carbs}g</span>
                <span className="text-red-600">F: {preview.fats}g</span>
              </div>
            </div>
            {preview.meals.map((meal, i) => (
              <div key={i} className="bg-card text-card-foreground rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold text-indigo-600">{meal.name} &middot; {meal.time}</p>
                  <p className="text-xs text-muted-foreground">{meal.foods.reduce((s, f) => s + f.calories, 0)} kcal</p>
                </div>
                {meal.foods.map((f, j) => (
                  <p key={j} className="text-xs text-muted-foreground">
                    {f.name} <span className="text-muted-foreground">&mdash; {f.quantity}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            {loading ? "Creating..." : "Create Plan"}
          </button>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🥗</p>
          <p className="font-medium text-muted-foreground">No meal plans yet</p>
          <p className="text-sm mt-1">Create a Nigerian-adapted meal plan above</p>
        </div>
      ) : (
        plans.map((plan) => (
          <div key={plan.id} className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div
              className="px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-muted"
              onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{plan.title}</h3>
                  {plan.isAiGenerated && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🤖 AI</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {GOALS.find((g) => g.value === plan.goal)?.label ?? plan.goal} &middot; {plan.totalCalories} kcal/day
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex gap-3 text-xs">
                  <span className="text-blue-600">P: {plan.protein}g</span>
                  <span className="text-yellow-600">C: {plan.carbs}g</span>
                  <span className="text-red-600">F: {plan.fats}g</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                  className="text-red-400 hover:text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
                <span className="text-muted-foreground">{expandedPlan === plan.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expandedPlan === plan.id && (
              <div className="border-t border-border p-5 space-y-3 bg-muted">
                {plan.meals.map((meal, i) => (
                  <div key={i} className="bg-card text-card-foreground rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-indigo-600">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.time}</p>
                    </div>
                    <div className="space-y-1.5">
                      {meal.foods.map((f, j) => (
                        <div key={j} className="flex justify-between items-center text-sm">
                          <span className="text-foreground">{f.name} <span className="text-muted-foreground text-xs">&mdash; {f.quantity}</span></span>
                          <span className="text-orange-600 font-medium text-xs">{f.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>P: {meal.foods.reduce((s, f) => s + f.protein, 0).toFixed(1)}g</span>
                      <span>C: {meal.foods.reduce((s, f) => s + f.carbs, 0).toFixed(1)}g</span>
                      <span>F: {meal.foods.reduce((s, f) => s + f.fats, 0).toFixed(1)}g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
