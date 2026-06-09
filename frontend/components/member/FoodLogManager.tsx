"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NIGERIAN_FOODS, type FoodItem } from "./FoodDatabase";

interface LogEntry {
  id: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
  unit: string;
}

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Props {
  memberId: string;
  selectedDate: string;
  logs: LogEntry[];
  totals: Totals;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"];

export default function FoodLogManager({ memberId, selectedDate, logs: initialLogs, totals: initialTotals }: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [totals, setTotals] = useState<Totals>(initialTotals);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [form, setForm] = useState({
    mealType: "Breakfast",
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    quantity: "1",
    unit: "serving",
  });

  const date = new Date(selectedDate);
  const dateStr = date.toISOString().split("T")[0];

  const searchResults = search.length > 1
    ? NIGERIAN_FOODS.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.localName?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  const selectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSearch(food.name);
    setForm({
      ...form,
      foodName: food.name,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fats: food.fats.toString(),
      unit: food.unit,
    });
  };

  const handleQuantityChange = (qty: string) => {
    const q = parseFloat(qty) || 1;
    if (selectedFood) {
      setForm({
        ...form,
        quantity: qty,
        calories: (selectedFood.calories * q).toFixed(0),
        protein: (selectedFood.protein * q).toFixed(1),
        carbs: (selectedFood.carbs * q).toFixed(1),
        fats: (selectedFood.fats * q).toFixed(1),
      });
    } else {
      setForm({ ...form, quantity: qty });
    }
  };

  const handleAdd = async () => {
    setError("");
    if (!form.foodName) { setError("Please enter or select a food."); return; }
    if (!form.calories) { setError("Please enter calories."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/nutrition/food-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          date: new Date(selectedDate).toISOString(),
          mealType: form.mealType,
          foodName: form.foodName,
          calories: form.calories,
          protein: form.protein || 0,
          carbs: form.carbs || 0,
          fats: form.fats || 0,
          quantity: form.quantity,
          unit: form.unit,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to log food.");
      } else {
        const newLog = await res.json();
        const cal = parseInt(form.calories) || 0;
        const prot = parseFloat(form.protein) || 0;
        const carb = parseFloat(form.carbs) || 0;
        const fat = parseFloat(form.fats) || 0;
        setLogs((prev) => [...prev, { ...newLog, mealType: form.mealType, foodName: form.foodName, calories: cal, protein: prot, carbs: carb, fats: fat, quantity: parseFloat(form.quantity), unit: form.unit }]);
        setTotals((prev) => ({ calories: prev.calories + cal, protein: prev.protein + prot, carbs: prev.carbs + carb, fats: prev.fats + fat }));
        setForm({ mealType: "Breakfast", foodName: "", calories: "", protein: "", carbs: "", fats: "", quantity: "1", unit: "serving" });
        setSearch("");
        setSelectedFood(null);
        setShowForm(false);
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (logId: string, cal: number, prot: number, carb: number, fat: number) => {
    const res = await fetch(`/api/nutrition/food-log?logId=${logId}`, { method: "DELETE" });
    if (res.ok) {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      setTotals((prev) => ({ calories: prev.calories - cal, protein: prev.protein - prot, carbs: prev.carbs - carb, fats: prev.fats - fat }));
      router.refresh();
    }
  };

  // Group by meal type
  const grouped = MEAL_TYPES.reduce((acc, type) => {
    const items = logs.filter((l) => l.mealType.toLowerCase() === type.toLowerCase());
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {} as Record<string, LogEntry[]>);

  return (
    <div className="space-y-4">
      {/* Date picker + totals */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => router.push(`?date=${e.target.value}`)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ Add Food"}
          </button>
        </div>

        {/* Daily totals */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Calories", value: totals.calories, unit: "kcal", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Protein", value: totals.protein.toFixed(1), unit: "g", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Carbs", value: totals.carbs.toFixed(1), unit: "g", color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Fats", value: totals.fats.toFixed(1), unit: "g", color: "text-red-600", bg: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.unit}</p>
              <p className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add food form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Log Food</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meal Type</label>
              <select
                value={form.mealType}
                onChange={(e) => setForm({ ...form, mealType: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Food Name</label>
              <input
                type="text"
                placeholder="Search Nigerian foods or type custom..."
                value={search || form.foodName}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setForm({ ...form, foodName: e.target.value });
                  if (!e.target.value) setSelectedFood(null);
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchResults.length > 0 && !selectedFood && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {searchResults.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => selectFood(food)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium">{food.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {food.calories} kcal / {food.unit}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { key: "calories", label: "Calories (kcal)" },
              { key: "protein", label: "Protein (g)" },
              { key: "carbs", label: "Carbs (g)" },
              { key: "fats", label: "Fats (g)" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
          >
            {loading ? "Adding..." : "Add to Log"}
          </button>
        </div>
      )}

      {/* Logs grouped by meal */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">Nothing logged yet for this day</p>
          <p className="text-sm mt-1">Click &quot;+ Add Food&quot; to start tracking</p>
        </div>
      ) : (
        Object.entries(grouped).map(([mealType, items]) => {
          const mealCal = items.reduce((s, l) => s + l.calories, 0);
          return (
            <div key={mealType} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">{mealType}</h3>
                <span className="text-sm text-gray-500">{mealCal} kcal</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((log) => (
                  <div key={log.id} className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.foodName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.quantity} {log.unit} · P: {log.protein}g · C: {log.carbs}g · F: {log.fats}g
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-orange-600">{log.calories} kcal</span>
                      <button
                        onClick={() => handleDelete(log.id, log.calories, log.protein, log.carbs, log.fats)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
