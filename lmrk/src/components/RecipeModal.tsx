import { useState } from "react";
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

export default function RecipeModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [name, setName] = useState("");
  const [iconIdx, setIconIdx] = useState(0);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([
    { name: "", amount: "", measure: MEASURES[0] }
  ]);
  const [instructions, setInstructions] = useState([""]);
  const router = useRouter();
  const { update } = useSession();

  if (!open) return null;

  const handleIngredientChange = (idx: number, field: string, value: string) => {
    setIngredients(ings => ings.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const handleAddIngredient = () => {
    setIngredients(ings => [...ings, { name: "", amount: "", measure: MEASURES[0] }]);
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
    // API call to save recipe
    const res = await fetch("/api/recipes/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        icon: iconIdx,
        description,
        ingredients,
        instructions,
      }),
    });
    if (res.ok) {
      // Refresh session to get updated user data
      await update();
      onClose();
      router.push("/recipes");
    } else {
      // Optionally handle error
      alert("Failed to save recipe.");
    }
  };

  const Icon = ICONS[iconIdx].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
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
                      placeholder="Amount"
                      value={ing.amount}
                      onChange={e => handleIngredientChange(idx, "amount", e.target.value)}
                      required
                    />
                    <select
                      className="border rounded p-1 text-sm"
                      value={ing.measure}
                      onChange={e => handleIngredientChange(idx, "measure", e.target.value)}
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
