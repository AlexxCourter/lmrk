"use client";
import { FaPlus, FaChevronRight } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RecipeModal from "@/components/RecipeModal";
import ShoppingListModal from "@/components/ShoppingListModal";
import { ICONS as RECIPE_ICONS } from "@/components/RecipeModal"; // Reuse icon list

export default function ToolsCards({
  recipes,
  shoppingLists,
}: {
  recipes: Record<string, unknown>[];
  shoppingLists: Record<string, unknown>[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);

  // Defensive: ensure recipes is always an array
  const recipeList = Array.isArray(recipes) ? recipes : [];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recipes Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[220px]">
          <h2 className="text-xl font-bold mb-4">Recipes</h2>
          <div className="flex-1">
            {recipeList.length > 0 ? (
              <ul className="space-y-2">
                {recipeList.map((recipe: Record<string, unknown>, idx: number) => {
                  const Icon = RECIPE_ICONS?.[recipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
                  return (
                    <li
                      key={recipe._id as string || idx}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-purple-700 hover:text-white transition cursor-pointer group"
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push("/recipes")}
                    >
                      <span className="text-2xl">
                        <Icon />
                      </span>
                      <span className="flex-1 font-semibold text-base truncate">
                        {recipe.name as string}
                      </span>
                      <FaChevronRight className="text-lg text-gray-400 group-hover:text-white" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-gray-500">No recipes yet! Create one to get started.</div>
            )}
          </div>
          <div className="h-8" /> {/* Spacer to ensure buttons don't overlap text */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              className="bg-purple-700 text-white px-4 py-2 rounded font-semibold hover:bg-purple-800 transition text-sm cursor-pointer"
              onClick={() => router.push("/recipes")}
            >
              My Recipes
            </button>
            <button
              className="bg-purple-700 text-white rounded-full p-2 hover:bg-purple-800 transition flex items-center justify-center cursor-pointer"
              style={{ width: 36, height: 36 }}
              aria-label="Create Recipe"
              onClick={() => setShowModal(true)}
            >
              <FaPlus />
            </button>
          </div>
        </div>
        {/* Shopping Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[220px]">
          <h2 className="text-xl font-bold mb-4">Shopping</h2>
          <div className="flex-1">
            {shoppingLists && shoppingLists.length > 0 ? (
              <ul className="space-y-2">
                {shoppingLists
                  .slice() // copy array
                  .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
                    // Sort by dateCreated descending (most recent first)
                    const aDate = new Date(a.dateCreated as string || 0).getTime();
                    const bDate = new Date(b.dateCreated as string || 0).getTime();
                    return bDate - aDate;
                  })
                  .slice(0, 3)
                  .map((list: Record<string, unknown>, idx: number) => (
                    <li
                      key={list._id as string || idx}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 cursor-pointer group transition"
                      style={{
                        background: typeof list.color === "string" ? list.color : "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => router.push("/shopping-lists")}
                    >
                      <span className="flex-1 font-semibold text-base truncate text-gray-800 group-hover:text-purple-800">
                        {list.name as string}
                      </span>
                      <FaChevronRight className="text-lg text-gray-400 group-hover:text-purple-700" />
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-gray-500">No shopping lists yet! Add items to get started.</div>
            )}
          </div>
          <div className="h-8" /> {/* Spacer to ensure buttons don't overlap text */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              className="bg-purple-700 text-white px-4 py-2 rounded font-semibold hover:bg-purple-800 transition text-sm cursor-pointer"
              onClick={() => router.push("/shopping-lists")}
            >
              My Lists
            </button>
            <button
              className="bg-purple-700 text-white rounded-full p-2 hover:bg-purple-800 transition flex items-center justify-center cursor-pointer"
              style={{ width: 36, height: 36 }}
              aria-label="Create Shopping List"
              onClick={() => setShowShoppingModal(true)}
            >
              <FaPlus />
            </button>
          </div>
        </div>
      </div>
      {showModal && (
        <RecipeModal open={showModal} onClose={() => setShowModal(false)} />
      )}
      {showShoppingModal && (
        <ShoppingListModal open={showShoppingModal} onClose={() => setShowShoppingModal(false)} />
      )}
    </>
  );
}
