"use client";
import { useState, useEffect } from "react";
import { FaRegSave } from "react-icons/fa";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeController } from "@/theme/ThemeController";
import { ICONS as RECIPE_ICONS } from "@/components/RecipeModal";
import { useUserData } from "@/components/UserDataProvider";


// Types
import type { Recipe as UserRecipe } from "../../models/User";

type SharedRecipeDoc = {
  _id: string;
  userId: string;
  username: string;
  recipe: UserRecipe;
};

// Use Session from next-auth, which includes preferences

export default function RecipeIdeasPage() {
  const { data: sessionData, update } = useSession();
  const session = sessionData as Session | null;
  const { data: userData } = useUserData();
  
  // Get user recipes from context
  const userRecipes = userData?.recipes || [];
  
  useEffect(() => {
    if (session?.user?.preferences?.theme) {
      const ctrl = ThemeController.getInstance();
      if (session.user.preferences.theme === "moonlight") ctrl.setMoonlight();
      else if (session.user.preferences.theme === "mint") ctrl.setMint();
      else ctrl.setDefault();
    }
  }, [session?.user?.preferences?.theme]);
  
  const sharedRecipeId = session?.user?.sharedRecipe || null;
  const username = session?.user?.name || "";
  const userId = session?.user?.email || "";

  // State
  const [sharedRecipes, setSharedRecipes] = useState<SharedRecipeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedToShare, setSelectedToShare] = useState<UserRecipe | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // recipe id being saved
  // Search/filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterMealType, setFilterMealType] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterColor, setFilterColor] = useState("");
  // Color swatches for filter
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
  // Filter and search logic for shared recipes
  const filteredSharedRecipes = sharedRecipes.filter(shared => {
    const r = shared.recipe;
    let match = true;
    if (searchTerm && !(r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || (Array.isArray(r.tags) && r.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))))) match = false;
    if (filterMealType && r.mealType !== filterMealType) match = false;
    if (filterTag && !(Array.isArray(r.tags) && r.tags.some((tag: string) => tag.toLowerCase().includes(filterTag.toLowerCase())))) match = false;
    if (filterColor && r.color !== filterColor) match = false;
    return match;
  });

  // Fetch shared recipes on mount (useEffect to avoid state update on unmounted)
  useEffect(() => {
    let mounted = true;
    fetch("/api/shared-recipes")
      .then(res => res.json())
      .then(data => {
        if (mounted) {
          setSharedRecipes(data.sharedRecipes || []);
          setLoading(false);
        }
      })
      .catch(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Save a shared recipe to user's recipes
  async function handleSaveRecipe(shared: SharedRecipeDoc) {
    setSaving(shared._id);
    const res = await fetch("/api/recipes/save-shared", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedRecipeId: shared._id }),
    });
    if (res.ok) {
      await update();
      setSaving(null);
      // Remove save button for this card
      setSharedRecipes(prev => prev.map(r => r._id === shared._id ? { ...r, justSaved: true } : r));
    } else {
      setSaving(null);
      alert("Failed to save recipe.");
    }
  }

  // Share a recipe
  async function handleShareRecipe() {
    if (!selectedToShare) return;
    setLoading(true);
    const res = await fetch("/api/shared-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId: selectedToShare._id,
        username,
        userId,
      }),
    });
    if (res.ok) {
      await update();
      setShowShareModal(false);
      setSelectedToShare(null);
      // Refresh shared recipes
      fetch("/api/shared-recipes")
        .then(res => res.json())
        .then(data => setSharedRecipes(data.sharedRecipes || []));
    } else {
      alert("Failed to share recipe.");
    }
    setLoading(false);
  }

  // UI for blank share card
  function ShareCard() {
    return (
      <div
        className="bg-white rounded-lg shadow p-2 flex flex-col items-center justify-center min-h-[120px] min-w-[140px] max-w-[220px] border-2 border-dashed border-purple-300 cursor-pointer hover:bg-purple-50 transition"
        onClick={() => setShowShareModal(true)}
      >
        <span className="text-purple-400 text-2xl mb-1">+</span>
        <span className="text-purple-700 font-semibold text-sm">Click to share a recipe</span>
      </div>
    );
  }

  // UI for share modal
  function ShareModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full relative flex flex-col max-h-[90vh]">
          <button
            className="absolute top-2 right-2 text-black hover:text-purple-700 text-3xl"
            onClick={() => setShowShareModal(false)}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="text-xl font-bold mb-4 text-black">Select a recipe to share</h2>
          <div className="flex-1 overflow-y-auto mb-4 pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userRecipes.length === 0 && (
                <div className="text-gray-500">No recipes to share.</div>
              )}
              {userRecipes.map(recipe => {
                const Icon = RECIPE_ICONS?.[recipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
                return (
                  <div
                    key={String(recipe._id)}
                    className={`bg-white rounded-lg shadow p-3 flex flex-col items-center cursor-pointer border-2 ${selectedToShare?._id === recipe._id ? "border-purple-700" : "border-transparent"}`}
                    onClick={() => setSelectedToShare(recipe as unknown as UserRecipe)}
                  >
                    <Icon className="text-purple-700 text-2xl mb-2" />
                    <span className="font-bold text-black mb-1">{recipe.name}</span>
                    <span className="text-xs text-gray-500 mb-1">{recipe.mealType}</span>
                    <span className="text-xs text-gray-400">{recipe.description?.slice(0, 40)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            className={`w-full py-2 rounded bg-purple-700 text-white font-semibold mt-2 disabled:opacity-50 ${!selectedToShare ? "cursor-not-allowed" : "hover:bg-purple-800"}`}
            disabled={!selectedToShare}
            onClick={handleShareRecipe}
          >
            Share
          </button>
        </div>
      </div>
    );
  }

  // UI for shared recipe cards
  function SharedRecipeCard({ shared }: { shared: SharedRecipeDoc & { justSaved?: boolean } }) {
    const Icon = RECIPE_ICONS?.[shared.recipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
    const isMine = shared.userId === userId;
    const isShared = sharedRecipeId === String(shared.recipe._id);
    return (
      <div
        className={`bg-white rounded-lg shadow p-4 flex flex-col justify-between relative min-h-[220px] max-h-[220px] transition-transform hover:scale-105 ${isShared ? "ring-2 ring-purple-400" : ""}`}
        style={{ minWidth: 240, maxWidth: 320, borderLeft: shared.recipe.color ? `8px solid ${shared.recipe.color}` : undefined }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="text-purple-700 text-xl" />
          <h2 className="text-lg font-bold text-black">{shared.recipe.name}</h2>
          {shared.recipe.mealType && (
            <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
              {shared.recipe.mealType}
            </span>
          )}
        </div>
        <div className="text-black text-sm mb-2 flex-1">
          {shared.recipe.description?.slice(0, 100) || "No description provided."}
        </div>
        {Array.isArray(shared.recipe.tags) && shared.recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-5">
            {shared.recipe.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        <div className="absolute bottom-3 left-4 text-xs text-black opacity-60">
          Shared by {shared.username}
        </div>
        {/* Save button (not for your own or already saved) */}
        {!isMine && !shared.justSaved && (
          <button
            className="absolute bottom-3 right-4 text-purple-700 hover:text-purple-900 text-xl cursor-pointer"
            title="Save Recipe"
            onClick={() => handleSaveRecipe(shared)}
            disabled={saving === shared._id}
          >
            <FaRegSave />
          </button>
        )}
      </div>
    );
  }

  return (
  <div className="min-h-screen w-full flex flex-col items-center py-10 px-4" style={{ background: "var(--theme-pageBg)" }}>
      <h1 className="text-2xl font-bold mb-8 text-white flex items-center gap-2">Recipe Ideas</h1>
      {/* Share card at top, then search bar below on mobile */}
      <div className="w-full max-w-5xl mb-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
        <div className="w-full sm:w-auto flex flex-col items-center">
          <div className="w-full flex justify-center">
            <div className="w-2/3 sm:w-auto">
              <ShareCard />
            </div>
          </div>
        </div>
        {/* Search and Filter UI */}
        <div className="w-full flex-1 flex items-center">
          <div className="flex items-center bg-white rounded-xl shadow px-2 sm:px-4 py-2 gap-2 sm:gap-3 w-full border border-purple-100 mx-2 sm:mx-0">
            {/* Search bar */}
            <div className="relative flex items-center flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"/></svg>
              </span>
              <input
                type="text"
                className="pl-12 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 text-base w-full bg-white placeholder-gray-400"
                placeholder="Search shared recipes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ minWidth: 0 }}
              />
            </div>
            {/* Filter icon */}
            <button
              className="p-3 rounded-full hover:bg-purple-100 focus:outline-none border border-purple-200 text-purple-700"
              title="Filters"
              onClick={() => setFiltersOpen(true)}
              style={{ minWidth: 40, minHeight: 40 }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.382a1 1 0 0 1-.293.707l-5.414 5.414A2 2 0 0 0 14 13.414V19a1 1 0 0 1-1.447.894l-2-1A1 1 0 0 1 10 18v-4.586a2 2 0 0 0-.293-1.121l-5.414-5.414A1 1 0 0 1 4 6.382V4Z"/></svg>
            </button>
          </div>
        </div>
      </div>
      {/* Share modal */}
      {showShareModal && <ShareModal />}
      {/* Filters Drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.15)" }}
            onClick={() => setFiltersOpen(false)}
          />
          {/* Drawer */}
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
              &times;
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

      {/* Shared recipes grid */}
      {loading ? (
        <div className="text-white text-lg">Loading shared recipes...</div>
      ) : filteredSharedRecipes.length === 0 ? (
        <div className="text-white text-lg">Couldn&apos;t find any shared recipes. Try sharing your own above!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {filteredSharedRecipes.map(shared => (
            <SharedRecipeCard key={shared._id} shared={shared} />
          ))}
        </div>
      )}
    </div>
  );
}
