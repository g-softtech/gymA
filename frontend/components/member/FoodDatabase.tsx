"use client";

import { useState } from "react";

export interface FoodItem {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  unit: string;
  localName?: string;
}

export const NIGERIAN_FOODS: FoodItem[] = [
  // Staples
  { name: "Jollof Rice", category: "Staples", calories: 180, protein: 4, carbs: 36, fats: 3, unit: "cup", localName: "Jollof" },
  { name: "White Rice", category: "Staples", calories: 206, protein: 4.3, carbs: 44.5, fats: 0.4, unit: "cup" },
  { name: "Eba (Garri)", category: "Staples", calories: 360, protein: 1.5, carbs: 85, fats: 0.5, unit: "cup" },
  { name: "Pounded Yam", category: "Staples", calories: 210, protein: 2.5, carbs: 50, fats: 0.3, unit: "cup" },
  { name: "Amala", category: "Staples", calories: 190, protein: 2, carbs: 45, fats: 0.2, unit: "cup" },
  { name: "Semovita", category: "Staples", calories: 200, protein: 6, carbs: 42, fats: 1, unit: "cup" },
  { name: "Fufu", category: "Staples", calories: 330, protein: 1.2, carbs: 82, fats: 0.1, unit: "cup" },
  { name: "Tuwo Shinkafa", category: "Staples", calories: 195, protein: 3.5, carbs: 44, fats: 0.3, unit: "cup" },
  { name: "Akpu", category: "Staples", calories: 310, protein: 1, carbs: 76, fats: 0.2, unit: "cup" },

  // Soups & Stews
  { name: "Egusi Soup", category: "Soups", calories: 320, protein: 18, carbs: 8, fats: 24, unit: "bowl" },
  { name: "Ogbono Soup", category: "Soups", calories: 280, protein: 15, carbs: 6, fats: 22, unit: "bowl" },
  { name: "Bitterleaf Soup", category: "Soups", calories: 230, protein: 14, carbs: 7, fats: 16, unit: "bowl" },
  { name: "Ofe Onugbu", category: "Soups", calories: 235, protein: 13, carbs: 7, fats: 17, unit: "bowl" },
  { name: "Efo Riro", category: "Soups", calories: 180, protein: 12, carbs: 10, fats: 11, unit: "bowl" },
  { name: "Okra Soup", category: "Soups", calories: 160, protein: 10, carbs: 12, fats: 9, unit: "bowl" },
  { name: "Banga Soup", category: "Soups", calories: 290, protein: 14, carbs: 9, fats: 22, unit: "bowl" },
  { name: "Groundnut Soup", category: "Soups", calories: 340, protein: 18, carbs: 11, fats: 26, unit: "bowl" },
  { name: "Tomato Stew", category: "Soups", calories: 130, protein: 8, carbs: 14, fats: 6, unit: "cup" },
  { name: "Pepper Soup", category: "Soups", calories: 140, protein: 18, carbs: 4, fats: 6, unit: "bowl" },

  // Proteins
  { name: "Suya (Beef)", category: "Proteins", calories: 220, protein: 28, carbs: 3, fats: 11, unit: "skewer" },
  { name: "Grilled Chicken", category: "Proteins", calories: 185, protein: 30, carbs: 0, fats: 7, unit: "100g" },
  { name: "Fried Fish", category: "Proteins", calories: 210, protein: 22, carbs: 8, fats: 11, unit: "piece" },
  { name: "Stockfish", category: "Proteins", calories: 170, protein: 35, carbs: 0, fats: 2, unit: "100g" },
  { name: "Smoked Fish", category: "Proteins", calories: 180, protein: 32, carbs: 0, fats: 5, unit: "100g" },
  { name: "Fried Beef", category: "Proteins", calories: 250, protein: 26, carbs: 2, fats: 16, unit: "100g" },
  { name: "Boiled Eggs", category: "Proteins", calories: 78, protein: 6.3, carbs: 0.6, fats: 5.3, unit: "egg" },
  { name: "Moin Moin", category: "Proteins", calories: 120, protein: 8, carbs: 14, fats: 4, unit: "piece" },
  { name: "Akara", category: "Proteins", calories: 180, protein: 9, carbs: 20, fats: 8, unit: "piece" },
  { name: "Goat Meat", category: "Proteins", calories: 143, protein: 27, carbs: 0, fats: 3.5, unit: "100g" },

  // Breakfast
  { name: "Ogi (Pap/Akamu)", category: "Breakfast", calories: 90, protein: 2, carbs: 20, fats: 0.5, unit: "cup" },
  { name: "Bread (White)", category: "Breakfast", calories: 265, protein: 9, carbs: 49, fats: 3.5, unit: "2 slices" },
  { name: "Beans Porridge", category: "Breakfast", calories: 210, protein: 14, carbs: 38, fats: 1.5, unit: "cup" },
  { name: "Yam and Egg", category: "Breakfast", calories: 280, protein: 10, carbs: 45, fats: 8, unit: "plate" },
  { name: "Plantain (Fried)", category: "Breakfast", calories: 240, protein: 1.5, carbs: 48, fats: 6, unit: "cup" },
  { name: "Plantain (Boiled)", category: "Breakfast", calories: 180, protein: 1.5, carbs: 47, fats: 0.3, unit: "cup" },

  // Snacks
  { name: "Puff Puff", category: "Snacks", calories: 220, protein: 4, carbs: 30, fats: 10, unit: "3 pieces" },
  { name: "Chin Chin", category: "Snacks", calories: 490, protein: 8, carbs: 68, fats: 21, unit: "cup" },
  { name: "Groundnuts", category: "Snacks", calories: 567, protein: 26, carbs: 16, fats: 49, unit: "cup" },
  { name: "Kuli Kuli", category: "Snacks", calories: 540, protein: 28, carbs: 22, fats: 40, unit: "cup" },
  { name: "Coconut", category: "Snacks", calories: 354, protein: 3.3, carbs: 15, fats: 33, unit: "cup" },
  { name: "Zobo Drink", category: "Drinks", calories: 40, protein: 0.5, carbs: 10, fats: 0, unit: "glass" },
  { name: "Kunu", category: "Drinks", calories: 80, protein: 2, carbs: 18, fats: 1, unit: "glass" },
  { name: "Tiger Nut Milk", category: "Drinks", calories: 100, protein: 2, carbs: 20, fats: 3, unit: "glass" },

  // Vegetables
  { name: "Ugwu (Pumpkin Leaf)", category: "Vegetables", calories: 40, protein: 4, carbs: 5, fats: 0.5, unit: "cup" },
  { name: "Waterleaf", category: "Vegetables", calories: 25, protein: 2.5, carbs: 3, fats: 0.3, unit: "cup" },
  { name: "Garden Egg", category: "Vegetables", calories: 35, protein: 1.8, carbs: 6, fats: 0.2, unit: "piece" },
  { name: "Okra", category: "Vegetables", calories: 33, protein: 2, carbs: 7, fats: 0.2, unit: "cup" },
  { name: "Bitter Leaf", category: "Vegetables", calories: 28, protein: 3, carbs: 4, fats: 0.3, unit: "cup" },

  // Fruits
  { name: "Mango", category: "Fruits", calories: 60, protein: 0.8, carbs: 15, fats: 0.4, unit: "medium" },
  { name: "Banana", category: "Fruits", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, unit: "medium" },
  { name: "Pawpaw (Papaya)", category: "Fruits", calories: 43, protein: 0.5, carbs: 11, fats: 0.3, unit: "cup" },
  { name: "Pineapple", category: "Fruits", calories: 50, protein: 0.5, carbs: 13, fats: 0.1, unit: "cup" },
  { name: "Watermelon", category: "Fruits", calories: 30, protein: 0.6, carbs: 8, fats: 0.2, unit: "cup" },
  { name: "Agbalumo (Star Apple)", category: "Fruits", calories: 55, protein: 0.6, carbs: 13, fats: 0.1, unit: "piece" },
];

const CATEGORIES = ["All", ...Array.from(new Set(NIGERIAN_FOODS.map((f) => f.category)))];

export default function FoodDatabase() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<FoodItem | null>(null);

  const filtered = NIGERIAN_FOODS.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.localName?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || f.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* Search & filter */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search Nigerian foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} foods found</p>
      </div>

      {/* Selected food detail */}
      {selected && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-foreground text-lg">{selected.name}</h3>
              {selected.localName && (
                <p className="text-sm text-muted-foreground">Also known as: {selected.localName}</p>
              )}
              <p className="text-xs text-indigo-600 mt-1">Per {selected.unit}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-muted-foreground text-xl">×</button>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: "Calories", value: `${selected.calories} kcal`, color: "bg-orange-100 text-orange-700" },
              { label: "Protein", value: `${selected.protein}g`, color: "bg-primary/10 text-primary" },
              { label: "Carbs", value: `${selected.carbs}g`, color: "bg-warning/10 text-warning" },
              { label: "Fats", value: `${selected.fats}g`, color: "bg-destructive/10 text-destructive" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-lg p-3 text-center`}>
                <p className="font-bold text-sm">{s.value}</p>
                <p className="text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Food grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((food) => (
          <button
            key={food.name}
            onClick={() => setSelected(food)}
            className={`text-left bg-card text-card-foreground rounded-xl border p-4 hover:border-indigo-300 hover:shadow-sm transition-all ${
              selected?.name === food.name ? "border-indigo-500 bg-indigo-50" : "border-border"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium text-foreground text-sm">{food.name}</p>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {food.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Per {food.unit}</p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-orange-600 font-medium">{food.calories} kcal</span>
              <span className="text-blue-600">P: {food.protein}g</span>
              <span className="text-yellow-600">C: {food.carbs}g</span>
              <span className="text-red-600">F: {food.fats}g</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
