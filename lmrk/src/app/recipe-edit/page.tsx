"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"];
const COLOR_OPTIONS = [
  "#f87171",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#f3f4f6",
  "#fff",
];

export default function RecipeEditPage() {
  const router = useRouter();
  // Example state, replace with real data fetching
  const [mealType, setMealType] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [color, setColor] = useState<string>("#fff");
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button
        className="mb-6 px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
        onClick={() => router.push("/tools")}
        style={{ position: "absolute", top: "80px", left: "32px" }}
      >
        Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Edit Recipe</h1>
      <form>
        {/* Meal Type */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Meal Type</label>
          <select
            className="w-full border rounded px-3 py-2 text-black"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            <option value="">Select meal type</option>
            {MEAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {/* Tags */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Tags</label>
          <input
            className="w-full border rounded px-3 py-2 text-black"
            placeholder="Enter tags separated by commas or spaces"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <div className="mt-1 text-xs text-gray-500">
            Example: quick, vegan, spicy
          </div>
        </div>
        {/* Color */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`w-7 h-7 rounded-full border-2 ${
                  color === opt ? "border-purple-700" : "border-gray-300"
                }`}
                style={{ background: opt }}
                onClick={() => setColor(opt)}
                aria-label={opt}
              />
            ))}
          </div>
        </div>
        {/* ...other fields... */}
        <button
          type="submit"
          className="bg-purple-700 text-white px-6 py-2 rounded font-semibold hover:bg-purple-800 transition text-base"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
