import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FaAppleAlt, FaCarrot, FaFish, FaDrumstickBite, FaIceCream, FaPizzaSlice,
  FaBreadSlice, FaCheese, FaEgg, FaLemon, FaTimes
} from "react-icons/fa";

export const ICONS = [
  { icon: FaAppleAlt, name: "Apple" },
  { icon: FaCarrot, name: "Carrot" },
  { icon: FaFish, name: "Fish" },
  { icon: FaDrumstickBite, name: "Chicken" },
  { icon: FaIceCream, name: "Ice Cream" },
  { icon: FaPizzaSlice, name: "Pizza" },
  { icon: FaBreadSlice, name: "Bread" },
  { icon: FaCheese, name: "Cheese" },
  { icon: FaEgg, name: "Egg" },
  { icon: FaLemon, name: "Lemon" },
];

const MEASURES = [
  "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb", "pcs"
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"];
const COLOR_OPTIONS = [
  "#f87171", // red
  "#fbbf24", // yellow
  "#34d399", // green
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
  "#f3f4f6", // gray
  "#fff",    // white
];

type RecipeModalInitialData = {
  name: string;
  iconIdx: number;
  description: string;
  ingredients: { name: string; quantity: string; unit: string }[];
  instructions: string[];
  mealType: string;
  tags: string;
  color: string;
  id?: string;
};

export default function RecipeModal({
  open,
  onClose,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: RecipeModalInitialData;
}) {
  // Use initialData if provided, otherwise default values
  const [name, setName] = useState(initialData?.name || "");
  const [iconIdx, setIconIdx] = useState(initialData?.iconIdx ?? 0);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [description, setDescription] = useState(initialData?.description || "");
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length
      ? initialData.ingredients
      : [{ name: "", quantity: "", unit: MEASURES[0] }]
  );
  const [instructions, setInstructions] = useState(
    initialData?.instructions?.length ? initialData.instructions : [""]
  );
  const [mealType, setMealType] = useState(initialData?.mealType || "");
  const [tags, setTags] = useState(initialData?.tags || "");
  const [color, setColor] = useState(initialData?.color || "#fff");
  const router = useRouter();
  const { update } = useSession();

  // When initialData changes (e.g. opening for edit), update state
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setIconIdx(initialData.iconIdx ?? 0);
      setDescription(initialData.description || "");
      // --- FIX: Normalize ingredient fields for edit ---
      setIngredients(
        initialData.ingredients?.length
          ? initialData.ingredients.map(ing => ({
              name: ing.name || "",
              quantity:
                typeof ing.quantity === "string"
                  ? ing.quantity
                  : typeof ing.quantity === "number"
                  ? String(ing.quantity)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  : typeof (ing as any).amount === "string"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ? (ing as any).amount
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  : typeof (ing as any).amount === "number"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ? String((ing as any).amount)
                  : "",
              unit:
                typeof ing.unit === "string"
                  ? ing.unit
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  : typeof (ing as any).measure === "string"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ? (ing as any).measure
                  : MEASURES[0],
            }))
          : [{ name: "", quantity: "", unit: MEASURES[0] }]
      );
      // --- END FIX ---
      setInstructions(
        initialData.instructions?.length ? initialData.instructions : [""]
      );
      setMealType(initialData.mealType || "");
      setTags(initialData.tags || "");
      setColor(initialData.color || "#fff");
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleIngredientChange = (idx: number, field: string, value: string) => {
    setIngredients(ings => ings.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const handleAddIngredient = () => {
    setIngredients(ings => [...ings, { name: "", quantity: "", unit: MEASURES[0] }]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ings => ings.filter((_, i) => i !== idx));
  };

  const handleInstructionChange = (idx: number, value: string) => {
    setInstructions(instrs => instrs.map((ins, i) => i === idx ? value : ins));
  };

  const handleAddInstruction = () => {
    setInstructions(instrs => [...instrs, ""]);
  };

  const handleRemoveInstruction = (idx: number) => {
    setInstructions(instrs => instrs.filter((_, i) => i !== idx));
  };

  // Placeholder for submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Close modal immediately so user doesn't see blank data
    onClose();
    // If editing (initialData has id), use update route, else use add route
    const isEdit = !!initialData?.id;
    const url = isEdit ? "/api/recipes/update" : "/api/recipes/add";
    const method = isEdit ? "PATCH" : "POST";
    const body = isEdit
      ? {
          id: initialData.id,
          name,
          icon: iconIdx,
          description,
          ingredients,
          instructions,
          mealType: mealType || undefined,
          tags: tags.split(/[ ,]+/).filter(Boolean),
          color,
        }
      : {
          name,
          icon: iconIdx,
          description,
          ingredients,
          instructions,
          mealType: mealType || undefined,
          tags: tags.split(/[ ,]+/).filter(Boolean),
          color,
        };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      // Refresh session to get updated user data
      await update();
      // Only push if not already on /recipes
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/recipes")) {
        router.push("/recipes");
      }
    } else {
      // Optionally handle error
      alert("Failed to save recipe.");
    }
  };

  const Icon = ICONS[iconIdx].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-purple-700 text-3xl"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>
        <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex flex-col items-center">
              <button
                type="button"
                className="bg-purple-100 border-2 border-purple-300 rounded-full w-14 h-14 flex items-center justify-center text-3xl text-purple-700 hover:border-purple-700"
                onClick={() => setShowIconPicker(v => !v)}
                aria-label="Select icon"
              >
                <Icon />
              </button>
              <span className="text-xs text-gray-500 mt-1">Select icon</span>
              {showIconPicker && (
                <div className="absolute mt-2 bg-white border rounded-lg shadow-lg p-4 grid grid-cols-5 gap-3 z-50 min-w-[260px] min-h-[80px]">
                  {ICONS.map((ic, idx) => (
                    <button
                      key={ic.name}
                      type="button"
                      className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${iconIdx === idx ? "border-purple-700 bg-purple-100" : "border-transparent"} hover:border-purple-400`}
                      onClick={() => { setIconIdx(idx); setShowIconPicker(false); }}
                    >
                      <ic.icon className="text-2xl" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              className="flex-1 text-2xl font-bold border-b-2 border-purple-200 focus:border-purple-700 outline-none px-2 py-1"
              placeholder="Enter recipe name..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          {/* SCROLLABLE CONTENT START */}
          <div className="flex-1 min-h-0 overflow-y-auto py-2 pr-3 pb-8">
            <div className="mb-4">
              <textarea
                className="w-full border rounded p-2 mt-2 text-sm"
                placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Ingredients:</h3>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded p-1 text-sm"
                      placeholder="Ingredient"
                      value={ing.name}
                      onChange={e => handleIngredientChange(idx, "name", e.target.value)}
                      required
                    />
                    <input
                      className="w-16 border rounded p-1 text-sm"
                      placeholder="Quantity"
                      value={ing.quantity}
                      onChange={e => handleIngredientChange(idx, "quantity", e.target.value)}
                      required
                    />
                    <select
                      className="border rounded p-1 text-sm"
                      value={ing.unit}
                      onChange={e => handleIngredientChange(idx, "unit", e.target.value)}
                    >
                      {MEASURES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-red-500"
                      onClick={() => handleRemoveIngredient(idx)}
                      aria-label="Delete ingredient"
                      disabled={ingredients.length === 1}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-purple-700 hover:underline text-sm"
                onClick={handleAddIngredient}
              >
                Add another ingredient
              </button>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Instructions:</h3>
              <div className="space-y-2">
                {instructions.map((ins, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded p-1 text-sm"
                      placeholder={`Step ${idx + 1}`}
                      value={ins}
                      onChange={e => handleInstructionChange(idx, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-red-500"
                      onClick={() => handleRemoveInstruction(idx)}
                      aria-label="Delete instruction"
                      disabled={instructions.length === 1}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-purple-700 hover:underline text-sm"
                onClick={handleAddInstruction}
              >
                Add another step
              </button>
            </div>
            {/* Meal Type */}
            <div className="mb-4">
              <label className="block font-semibold mb-1">Meal Type</label>
              <select
                className="w-full border rounded px-3 py-2 text-black"
                value={mealType}
                onChange={e => setMealType(e.target.value)}
              >
                <option value="">Select meal type</option>
                {MEAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
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
                onChange={e => setTags(e.target.value)}
              />
              <div className="mt-1 text-xs text-gray-500">
                Example: quick, vegan, spicy
              </div>
            </div>
            {/* Color */}
            <div className="mb-4">
              <label className="block font-semibold mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 ${color === opt ? "border-purple-700" : "border-gray-300"}`}
                    style={{ background: opt }}
                    onClick={() => setColor(opt)}
                    aria-label={opt}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* SCROLLABLE CONTENT END */}
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              className="bg-purple-700 text-white px-6 py-2 rounded font-semibold hover:bg-purple-800 transition text-base"
            >
              Save Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
