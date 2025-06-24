"use client";
import { useState, useEffect } from "react";
import { FaAppleAlt, FaShoppingCart, FaThLarge, FaList, FaFilter, FaTimes, FaPencilAlt } from "react-icons/fa";
import { useSession } from "next-auth/react";
import RecipeModal from "@/components/RecipeModal";
import { useRef } from "react";
import { ICONS as RECIPE_ICONS } from "@/components/RecipeModal";

// Extend the user type to include recipes
type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients?: { id: string; name: string; quantity?: string; unit?: string }[];
  instructions?: string[];
  mealType?: "Breakfast" | "Lunch" | "Dinner" | "Dessert" | "Snack";
  tags?: string[];
  color?: string;
  [key: string]: unknown;
};

type UserWithRecipes = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  recipes?: Recipe[];
  activeList?: string;
  shoppingLists?: Record<string, unknown>[];
};

type SessionWithRecipes = {
  user?: UserWithRecipes;
  [key: string]: unknown;
};

export default function RecipesPage() {
  const { data: sessionData, update } = useSession();
  const session = sessionData as SessionWithRecipes | null;

  // Use recipes from the user's session data
  const recipes = session?.user?.recipes || [];

  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [toastProgress, setToastProgress] = useState(0);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const toastInterval = useRef<NodeJS.Timeout | null>(null);

  // View mode state: "card" or "list"
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  // For list view, track selected recipe (default to first recipe)
  const [listSelected, setListSelected] = useState<Recipe | null>(null);

  // Filters drawer state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterMealType, setFilterMealType] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterColor, setFilterColor] = useState<string>("");

  // Sidebar open state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter recipes based on filters
  let filteredRecipes = recipes.filter((recipe: Recipe) => {
    // Defensive: skip undefined/null recipes
    if (!recipe) return false;
    let match = true;
    if (filterMealType && recipe.mealType !== filterMealType) match = false;
    if (
      filterTag &&
      !(
        Array.isArray(recipe.tags) &&
        recipe.tags.some(tag => typeof tag === "string" && tag.toLowerCase().includes(filterTag.toLowerCase()))
      )
    )
      match = false;
    if (filterColor && recipe.color !== filterColor) match = false;
    return match;
  });

  // Clear selected recipe if filters change and selected is not in filtered list
  useEffect(() => {
    if (
      viewMode === "list" &&
      listSelected &&
      !filteredRecipes.some(r => r.id === listSelected.id)
    ) {
      setListSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMealType, filterTag, filterColor, filteredRecipes, viewMode]);

  // Helper to transform a recipe to RecipeModal's expected fields
  function getModalInitialData(recipe: Recipe) {
    return {
      name: recipe.name || "",
      iconIdx: typeof recipe.icon === "number" ? recipe.icon : 0,
      description: recipe.description || "",
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map((ing: any) => ({
            name: ing.name || "",
            // Safely cast legacy keys to new keys for quantity and unit
            quantity:
              typeof ing.quantity === "string"
                ? ing.quantity
                : typeof ing.quantity === "number"
                ? String(ing.quantity)
                : typeof ing.amount === "string"
                ? ing.amount
                : typeof ing.amount === "number"
                ? String(ing.amount)
                : "",
            unit:
              typeof ing.unit === "string"
                ? ing.unit
                : typeof ing.measure === "string"
                ? ing.measure
                : "",
          }))
        : [{ name: "", quantity: "", unit: "g" }],
      instructions: Array.isArray(recipe.instructions) && recipe.instructions.length > 0
        ? recipe.instructions
        : [""],
      mealType: recipe.mealType || "",
      tags: Array.isArray(recipe.tags) ? recipe.tags.join(", ") : "",
      color: recipe.color || "#fff",
      id: typeof recipe.id === "string"
        ? recipe.id
        : typeof recipe._id === "string"
        ? recipe._id
        : undefined,
    };
  }

  // Add ingredients to active shopping list, or create a new one if none
  const handleAddToShoppingList = async (ingredients: Record<string, unknown>[]) => {
    let listName = "";
    const addedCount = ingredients.length;

    if (!session?.user?.activeList) {
      // No active list: create a new one
      const res = await fetch("/api/shopping-lists/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "new list",
          color: "#fff",
          dateCreated: new Date().toISOString(),
          items: ingredients.map((ing: Record<string, unknown>) => ({
            name: ing.name,
            quantity: "1",
            checked: false,
          })),
        }),
      });
      if (res.ok) {
        await update();
        // Get the new list name from response or fallback
        const data = await res.json();
        listName = data.shoppingList?.name || "new list";
        // Set as active list
        if (data.shoppingList?._id) {
          await fetch("/api/shopping-lists/set-active", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listId: data.shoppingList._id }),
          });
          await update();
        showToast(`${addedCount} items added to ${listName}`);
        }
      } else {
        alert("Failed to create shopping list.");
      }
    } else {
      // Add to existing active list
      const res = await fetch("/api/shopping-lists/add-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      if (res.ok) {
        await update();
        // Find the active list name
        const activeList = session && session.user && session.user.shoppingLists
          ? session.user.shoppingLists.find(
              (list: Record<string, unknown>) =>
                (list._id?.toString?.() || list._id) ===
                (session?.user?.activeList?.toString?.() || session?.user?.activeList)
            )
          : undefined;
        listName = typeof activeList?.name === "string" ? activeList.name : "shopping list";
        showToast(`${addedCount} items added to ${listName}`);
      } else {
        alert("Failed to add ingredients to shopping list.");
      }
    }
  };

  // Toast helper
  function showToast(message: string) {
    setToast({ message, visible: true });
    setToastProgress(0);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    if (toastInterval.current) clearInterval(toastInterval.current);

    // Animate progress bar (0 to 100 over 3s)
    let progress = 0;
    toastInterval.current = setInterval(() => {
      progress += 100 / 30;
      setToastProgress(progress);
      if (progress >= 100 && toastInterval.current) {
        clearInterval(toastInterval.current);
      }
    }, 100);

    toastTimeout.current = setTimeout(() => {
      setToast({ message: "", visible: false });
      setToastProgress(0);
      if (toastInterval.current) clearInterval(toastInterval.current);
    }, 3000);
  }

  if (!recipes.length) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
        }}
      >
        <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center min-w-[300px] min-h-[200px]">
          <h2 className="text-xl font-bold mb-4 text-black">
            No recipes yet.
          </h2>
          <button
            className="bg-purple-700 text-white px-6 py-2 rounded font-semibold hover:bg-purple-800 transition text-base"
            onClick={() => setShowModal(true)}
          >
            New Recipe
          </button>
        </div>
        {showModal && (
          <RecipeModal open={showModal} onClose={() => setShowModal(false)} />
        )}
      </div>
    );
  }

  // Filter recipes based on filters
    filteredRecipes = recipes.filter((recipe: Recipe) => {
    // Defensive: skip undefined/null recipes
    if (!recipe) return false;
    let match = true;
    if (filterMealType && recipe.mealType !== filterMealType) match = false;
    if (
      filterTag &&
      !(
        Array.isArray(recipe.tags) &&
        recipe.tags.some(tag => typeof tag === "string" && tag.toLowerCase().includes(filterTag.toLowerCase()))
      )
    )
      match = false;
    if (filterColor && recipe.color !== filterColor) match = false;
    return match;
  });

  // Ensure listSelected is always in filteredRecipes
  // If not, reset to first filtered recipe
  if (
    viewMode === "list" &&
    listSelected &&
    !filteredRecipes.some(r => r.id === listSelected.id)
  ) {
    setListSelected(filteredRecipes.length > 0 ? filteredRecipes[0] : null);
  }

  // Helper to get selected recipe for list view
  const selectedRecipe =
    viewMode === "list"
      ? (listSelected || (filteredRecipes.length > 0 ? filteredRecipes[0] : null))
      : selected;

  // Color swatches for color selection/filtering
  const colorOptions = [
    "#f87171", // red
    "#fbbf24", // yellow
    "#34d399", // green
    "#60a5fa", // blue
    "#a78bfa", // purple
    "#f472b6", // pink
    "#f3f4f6", // gray
    "#fff",    // white
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-10 px-4"
      style={{
        background: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
      }}
    >
      {/* Toast message */}
      {toast.visible && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 px-0"
          style={{
            minWidth: 220,
            maxWidth: 340,
          }}
        >
          <div
            className="rounded-full shadow-lg flex items-center gap-4 relative"
            style={{
              background: "#f3f4f6", // very light gray
              color: "#000", // changed from #222 to #000 for black text
              padding: "0.75rem 1.5rem",
              fontWeight: 500,
              fontSize: "1rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <span>{toast.message}</span>
            <button
              className="ml-2 text-black hover:text-purple-700 text-xl"
              onClick={() => {
                setToast({ message: "", visible: false });
                setToastProgress(0);
                if (toastTimeout.current) clearTimeout(toastTimeout.current);
                if (toastInterval.current) clearInterval(toastInterval.current);
              }}
              aria-label="Close"
              style={{ lineHeight: 1 }}
            >
              &times;
            </button>
            {/* Progress bar */}
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: 4,
                width: `${toastProgress}%`,
                background: "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
                borderBottomLeftRadius: 9999,
                borderBottomRightRadius: 9999,
                transition: "width 0.1s linear",
                zIndex: 2,
              }}
            />
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-8 text-white flex items-center gap-2">
        My Recipes
        {viewMode === "list" && (
          <button
            className="sm:hidden ml-2 p-2 rounded-full bg-white text-purple-700 border border-purple-200 shadow hover:bg-purple-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open recipe list"
            type="button"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="7" width="16" height="2" rx="1" fill="currentColor" />
              <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
              <rect x="4" y="15" width="16" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        )}
      </h1>
      {/* View mode menu bar */}
      <div className="flex items-center justify-center w-full max-w-5xl mb-8">
        <div className="bg-white rounded-full shadow px-4 py-2 flex gap-4 items-center border border-purple-200">
          <button
            className={`p-2 rounded-full hover:bg-purple-100 focus:outline-none ${viewMode === "card" ? "bg-purple-100" : ""}`}
            title="Card Mode"
            onClick={() => setViewMode("card")}
          >
            <FaThLarge className="text-purple-700 text-xl" />
          </button>
          <button
            className={`p-2 rounded-full hover:bg-purple-100 focus:outline-none ${viewMode === "list" ? "bg-purple-100" : ""}`}
            title="List Mode"
            onClick={() => {
              setViewMode("list");
              setListSelected(filteredRecipes.length > 0 ? filteredRecipes[0] : null);
              setSelected(null);
            }}
          >
            <FaList className="text-purple-700 text-xl" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-purple-100 focus:outline-none"
            title="Filters"
            onClick={() => setFiltersOpen(true)}
          >
            <FaFilter className="text-purple-700 text-xl" />
          </button>
        </div>
      </div>

      {/* Filters Drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* More transparent overlay */}
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.15)" }}
            onClick={() => setFiltersOpen(false)}
          />
          {/* Slide-in animation for drawer */}
          <div
            className="relative bg-white w-full max-w-xs h-full shadow-lg flex flex-col p-6 z-50 transition-transform duration-300 ease-in-out"
            style={{
              transform: filtersOpen ? "translateX(0)" : "translateX(100%)",
              right: 0,
            }}
          >
            <button
              className="absolute top-4 right-4 text-2xl text-purple-700 hover:text-purple-900"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-6 text-black" style={{ fontFamily: "'Bree Serif', serif" }}>
              Filters
            </h2>
            {/* Meal Type */}
            <div className="mb-4">
              <label className="block text-black font-semibold mb-1">Meal Type</label>
              <select
                className="w-full border rounded px-3 py-2 text-black"
                value={filterMealType}
                onChange={e => setFilterMealType(e.target.value)}
              >
                <option value="">All</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Dessert">Dessert</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
            {/* Tags */}
            <div className="mb-4">
              <label className="block text-black font-semibold mb-1">Tag</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-black"
                placeholder="Enter tag"
                value={filterTag}
                onChange={e => setFilterTag(e.target.value)}
              />
            </div>
            {/* Color */}
            <div className="mb-4">
              <label className="block text-black font-semibold mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  className={`w-7 h-7 rounded-full border-2 ${filterColor === "" ? "border-purple-700" : "border-gray-300"}`}
                  style={{ background: "#fff" }}
                  onClick={() => setFilterColor("")}
                  title="All"
                  type="button"
                />
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`w-7 h-7 rounded-full border-2 ${filterColor === color ? "border-purple-700" : "border-gray-300"}`}
                    style={{ background: color }}
                    onClick={() => setFilterColor(color)}
                    title={color}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <button
              className="mt-4 bg-purple-700 text-white px-4 py-2 rounded font-semibold hover:bg-purple-800 transition"
              onClick={() => setFiltersOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {filteredRecipes.map((recipe: Recipe, idx: number) => {
              const Icon = RECIPE_ICONS?.[recipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
              return (
                <div
                  key={String(recipe.id ?? recipe._id ?? idx)}
                  className="bg-white rounded-lg shadow p-4 flex flex-col justify-between cursor-pointer relative min-h-[220px] max-h-[220px] transition-transform hover:scale-105"
                  style={{
                    minWidth: 240,
                    maxWidth: 320,
                    cursor: "pointer",
                    borderLeft: recipe.color ? `8px solid ${recipe.color}` : undefined,
                  }}
                  onClick={() => setSelected(recipe)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="text-purple-700 text-xl" />
                    <h2 className="text-lg font-bold text-black">
                      {typeof recipe.name === "string" ? recipe.name : ""}
                    </h2>
                    {recipe.mealType && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                        {recipe.mealType}
                      </span>
                    )}
                  </div>
                  <div className="text-black text-sm mb-2 flex-1">
                    {typeof recipe.description === "string"
                      ? recipe.description.slice(0, 100)
                      : "No description provided."}
                    {typeof recipe.description === "string" && recipe.description.length > 100 ? "..." : ""}
                  </div>
                  {/* Tags: show up to 3, and add margin-bottom for spacing */}
                  {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-5">
                      {recipe.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-4 text-xs text-black opacity-60">
                    Click card for full recipe
                  </div>
                  {/* Pencil icon for edit */}
                  <button
                    className="absolute bottom-3 right-14 text-purple-700 hover:text-purple-900 text-xl cursor-pointer"
                    title="Edit Recipe"
                    onClick={e => {
                      e.stopPropagation();
                      setEditRecipe(recipe);
                    }}
                  >
                    <FaPencilAlt />
                  </button>
                  <button
                    className="absolute bottom-3 right-4 text-purple-700 hover:text-purple-900 text-xl cursor-pointer"
                    title="Add ingredients to shopping list"
                    onClick={e => {
                      e.stopPropagation();
                      handleAddToShoppingList(
                        (recipe.ingredients as Record<string, unknown>[]) || []
                      );
                    }}
                  >
                    <FaShoppingCart />
                  </button>
                </div>
              );
            })}
          </div>
          {/* Pop-up modal for recipe details */}
          {selected && (() => {
            const Icon = RECIPE_ICONS?.[selected.icon as number]?.icon || RECIPE_ICONS[0].icon;
            return (
              <>
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{
                    background: "rgba(0,0,0,0.45)",
                  }}
                  onClick={() => setSelected(null)}
                >
                  <div
                    className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative"
                    style={{
                      borderLeft: selected.color ? `8px solid ${selected.color}` : undefined,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="absolute top-2 right-2 text-black hover:text-purple-700 text-3xl"
                      onClick={() => setSelected(null)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="text-purple-700 text-2xl" />
                      <h2 className="text-xl font-bold text-black">
                        {typeof selected.name === "string" ? selected.name : ""}
                      </h2>
                      {typeof selected.mealType === "string" && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                          {selected.mealType}
                        </span>
                      )}
                    </div>
                    {/* Tags */}
                    {Array.isArray(selected.tags) && selected.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {selected.tags.map((tag: string) => (
                          <span key={tag} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="mb-4 text-black">
                      {typeof selected.description === "string"
                        ? selected.description
                        : "No description provided."}
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold mb-1 text-black">Ingredients:</h3>
                      <ul className="list-disc list-inside text-sm text-black">
                        {(Array.isArray(selected.ingredients) ? selected.ingredients : []).map((ing: any, idx: number) => (
                          <li key={ing.id || idx}>
                            {String(ing.name)} - {String(ing.quantity ?? ing.amount ?? "")} {String(ing.unit ?? ing.measure ?? "")}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-black">Instructions:</h3>
                      <ol className="list-decimal list-inside text-sm text-black space-y-1">
                        {(Array.isArray(selected.instructions) ? selected.instructions : []).map((step: string, idx: number) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
          {/* Recipe edit modal */}
          {editRecipe && (
            <RecipeModal
              open={!!editRecipe}
              onClose={() => setEditRecipe(null)}
              initialData={getModalInitialData(editRecipe)}
            />
          )}
        </>
      )}
      {/* List View */}
      {viewMode === "list" && (
        <div className="flex w-full max-w-5xl gap-6">
          {/* Sidebar for desktop, tray for mobile */}
          {/* Mobile tray */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-black bg-opacity-30"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative bg-white w-64 max-w-xs h-full shadow-lg flex flex-col py-4 px-2 z-50 animate-slide-in-left">
                <button
                  className="absolute top-2 right-2 text-2xl text-purple-700 hover:text-purple-900"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
                <h2 className="text-lg font-bold mb-4 text-black px-2">Recipes</h2>
                <ul className="flex-1 overflow-y-auto">
                  {filteredRecipes.map((recipe: Recipe, idx: number) => (
                    <li key={String(recipe.id ?? recipe._id ?? idx)}>
                      <button
                        className={`w-full text-left px-4 py-2 rounded mb-1 font-medium transition border-l-4 ${
                          (listSelected?.id ?? filteredRecipes[0]?.id) === recipe.id
                            ? "bg-purple-100 text-purple-700 border-purple-700"
                            : "hover:bg-purple-50 text-black border-transparent"
                        }`}
                        style={{
                          borderColor:
                            (listSelected?.id ?? filteredRecipes[0]?.id) === recipe.id
                              ? recipe.color || "#a78bfa"
                              : undefined,
                          // Remove boxShadow highlight
                        }}
                        onClick={() => {
                          setListSelected(recipe);
                          setSidebarOpen(false);
                        }}
                      >
                        <span className="inline-block w-3 h-3 rounded-full mr-2 align-middle" style={{ background: recipe.color || "#e5e7eb" }} />
                        {recipe.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {/* Desktop sidebar */}
          <div className="bg-white rounded-lg shadow flex-col min-w-[200px] max-w-[240px] w-1/4 py-4 px-2 hidden sm:flex">
            <h2 className="text-lg font-bold mb-4 text-black px-2">Recipes</h2>
            <ul className="flex-1">
              {filteredRecipes.map((recipe: Recipe, idx: number) => (
                <li key={String(recipe.id ?? recipe._id ?? idx)}>
                  <button
                    className={`w-full text-left px-4 py-2 rounded mb-1 font-medium transition border-l-4 ${
                      (listSelected?.id ?? filteredRecipes[0]?.id) === recipe.id
                        ? "bg-purple-100 text-purple-700 border-purple-700"
                        : "hover:bg-purple-50 text-black border-transparent"
                    }`}
                    style={{
                      borderColor:
                        (listSelected?.id ?? filteredRecipes[0]?.id) === recipe.id
                          ? recipe.color || "#a78bfa"
                          : undefined,
                      // Remove boxShadow highlight
                    }}
                    onClick={() => setListSelected(recipe)}
                  >
                    <span className="inline-block w-3 h-3 rounded-full mr-2 align-middle" style={{ background: recipe.color || "#e5e7eb" }} />
                    {recipe.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* Details Card */}
          <div className="flex-1 relative">
            {selectedRecipe && (() => {
              const Icon = RECIPE_ICONS?.[selectedRecipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
              return (
                <div
                  className="bg-white rounded-xl shadow-2xl p-8 w-full relative"
                  style={{
                    borderLeft: selectedRecipe.color ? `8px solid ${selectedRecipe.color}` : undefined,
                    // Remove boxShadow highlight
                  }}
                >
                  {/* Pencil icon for edit (top right) */}
                  <button
                    className="absolute top-4 right-4 text-purple-700 hover:text-purple-900 text-2xl cursor-pointer"
                    title="Edit Recipe"
                    onClick={() => setEditRecipe(selectedRecipe as Recipe)}
                  >
                    <FaPencilAlt />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="text-purple-700 text-2xl" />
                    <h2 className="text-xl font-bold text-black">
                      {typeof selectedRecipe.name === "string" ? selectedRecipe.name : ""}
                    </h2>
                    {typeof selectedRecipe.mealType === "string" && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                        {selectedRecipe.mealType}
                      </span>
                    )}
                  </div>
                  {/* Tags */}
                  {Array.isArray(selectedRecipe.tags) && selectedRecipe.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {selectedRecipe.tags.map((tag: string) => (
                        <span key={tag} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="mb-4 text-black">
                    {typeof selectedRecipe.description === "string"
                      ? selectedRecipe.description
                      : "No description provided."}
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-1 text-black">Ingredients:</h3>
                    <ul className="list-disc list-inside text-sm text-black">
                      {(Array.isArray(selectedRecipe.ingredients) ? selectedRecipe.ingredients : []).map((ing: any, idx: number) => (
                        <li key={ing.id || idx}>
                          {String(ing.name)} - {String(ing.quantity ?? ing.amount ?? "")} {String(ing.unit ?? ing.measure ?? "")}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-black">Instructions:</h3>
                    <ol className="list-decimal list-inside text-sm text-black space-y-1">
                      {(Array.isArray(selectedRecipe.instructions) ? selectedRecipe.instructions : []).map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* Recipe creation or edit modal */}
      {(showModal || editRecipe) && (
        <RecipeModal
          open={showModal || !!editRecipe}
          onClose={() => {
            setShowModal(false);
            // If editing in list view, update listSelected to reflect changes
            if (editRecipe && viewMode === "list") {
              // Find the updated recipe in the latest recipes array after session update
              setTimeout(() => {
                // Use latest recipes from session (after update)
                const updated = session?.user?.recipes?.find(
                  r => r.id === editRecipe.id
                );
                if (updated) setListSelected(updated);
              }, 0);
            }
            setEditRecipe(null);
          }}
          initialData={editRecipe ? getModalInitialData(editRecipe) : undefined}
        />
      )}
      {/* Spacer for floating menu */}
      <div style={{ height: 68 }} />
    </div>
  );
}