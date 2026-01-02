"use client";
import { useState, useMemo, useEffect } from "react";
import { FaTrash, FaSearch, FaShoppingCart } from "react-icons/fa";
import type { Recipe as UserRecipe } from "../../models/User";
import { useSession } from "next-auth/react";
import { useUserData } from "@/components/UserDataProvider";
import { ThemeController } from "@/theme/ThemeController";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const meals = ["BREAKFAST", "LUNCH", "DINNER"];

type Meal = "BREAKFAST" | "LUNCH" | "DINNER";
type DayPlan = Record<Meal, string | null>;

export default function MealPlannerPage() {
  const { data: sessionData } = useSession();
  const { data: userData } = useUserData();
  
  // Apply theme
  useEffect(() => {
    const userPreferences = (sessionData?.user as { preferences?: { theme?: string } })?.preferences;
    const theme = userPreferences?.theme;
    if (theme) {
      const ctrl = ThemeController.getInstance();
      if (theme === "moonlight") ctrl.setMoonlight();
      else if (theme === "mint") ctrl.setMint();
      else ctrl.setDefault();
    }
  }, [sessionData?.user]);

  // Use cached user data recipes
  const userRecipes = userData?.recipes || [];
  
  // Helper to get a string id for any recipe
  function getRecipeId(recipe: { id?: string; _id?: string | { toString: () => string } }): string {
    // Cached recipes have 'id' as string
    if (recipe.id && typeof recipe.id === "string") return recipe.id;
    if (recipe._id) {
      if (typeof recipe._id === "string") return recipe._id;
      return recipe._id.toString();
    }
    return "";
  }

  // Use recipes directly from cached data (they already have id as string)
  const recipes = userRecipes;

  const [mealPlan, setMealPlan] = useState<DayPlan[]>(
    () => days.map(() => ({ BREAKFAST: null, LUNCH: null, DINNER: null }))
  );
  const [draggedRecipe, setDraggedRecipe] = useState<UserRecipe | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingToCart, setSendingToCart] = useState(false);

  // Get theme colors
  const themeColors = ThemeController.getInstance().colors;
  const textColor = themeColors.menuBarText;
  const iconColor = themeColors.main;

  // Search logic: filter by name or tags
  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes;
    const term = searchTerm.trim().toLowerCase();
    return recipes.filter(r =>
      r.name.toLowerCase().includes(term) ||
      (Array.isArray(r.tags) && r.tags.some((tag: string) => tag.toLowerCase().includes(term)))
    );
  }, [searchTerm, recipes]);

  function handleDrop(dayIdx: number, meal: Meal) {
    if (!draggedRecipe) return;
    setMealPlan(plan =>
      plan.map((day, i) =>
        i === dayIdx ? { ...day, [meal]: getRecipeId(draggedRecipe) } : day
      )
    );
    setDraggedRecipe(null);
  }

  function handleRemove(dayIdx: number, meal: Meal) {
    setMealPlan(plan =>
      plan.map((day, i) =>
        i === dayIdx ? { ...day, [meal]: null } : day
      )
    );
  }

  // Send meal plan to shopping list
  async function handleSendToShoppingList() {
    if (!userData?.activeList) {
      alert("Please set an active shopping list first!");
      return;
    }

    setSendingToCart(true);
    try {
      // Collect all unique recipe IDs from the meal plan
      const recipeIds = new Set<string>();
      mealPlan.forEach(day => {
        Object.values(day).forEach(recipeId => {
          if (recipeId) recipeIds.add(recipeId);
        });
      });

      // Send each recipe to the shopping list
      for (const recipeId of recipeIds) {
        const recipe = recipes.find(r => getRecipeId(r) === recipeId);
        if (!recipe) continue;

        const response = await fetch("/api/shopping-lists/add-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add recipe: ${recipe.name}`);
        }
      }

      alert("Meal plan added to shopping list!");
    } catch (error) {
      console.error("Error sending to shopping list:", error);
      alert("Failed to add meal plan to shopping list. Please try again.");
    } finally {
      setSendingToCart(false);
    }
  }

  // Responsive: show sidebar or drawer
  // const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
  <div className="flex min-h-screen flex-col" style={{ background: "var(--theme-pageBg)" }}>
      {/* Meal planner toolbar - now matches meal planner width */}
      <div className="w-full flex items-center justify-between px-4 py-2 shadow-sm border-b mb-2 mx-auto max-w-[1600px]" 
           style={{ 
             minHeight: 40, 
             background: "var(--theme-floatingMenuBg)",
             borderColor: "var(--theme-main)"
           }}>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full transition-colors"
            style={{
              color: iconColor,
              background: searchOpen ? "var(--theme-main)" : "transparent",
            }}
            title="Search Recipes"
            onClick={() => setSearchOpen(o => !o)}
            onMouseEnter={(e) => !searchOpen && (e.currentTarget.style.background = "rgba(var(--theme-main-rgb, 109, 40, 217), 0.1)")}
            onMouseLeave={(e) => !searchOpen && (e.currentTarget.style.background = "transparent")}
          >
            <FaSearch className="text-lg" style={{ color: searchOpen ? "#fff" : iconColor }} />
          </button>
          {searchOpen && (
            <input
              autoFocus
              type="text"
              className="ml-2 px-2 py-1 border rounded focus:outline-none focus:ring text-sm"
              style={{ 
                borderColor: "var(--theme-main)",
                color: textColor,
              }}
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full transition-colors flex items-center gap-2"
            style={{
              color: iconColor,
              background: "transparent",
            }}
            title="Send meal plan to shopping list"
            onClick={handleSendToShoppingList}
            disabled={sendingToCart}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(var(--theme-main-rgb, 109, 40, 217), 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <FaShoppingCart className="text-lg" style={{ color: iconColor }} />
            {sendingToCart && <span className="text-xs" style={{ color: textColor }}>Sending...</span>}
          </button>
          <button
            className={`p-2 rounded-full transition-colors ${deleteMode ? "bg-red-200" : ""}`}
            title="Delete Mode"
            onClick={() => setDeleteMode(d => !d)}
            onMouseEnter={(e) => !deleteMode && (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")}
            onMouseLeave={(e) => !deleteMode && (e.currentTarget.style.background = deleteMode ? "#fecaca" : "transparent")}
          >
            <FaTrash className="text-red-500 text-lg" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto min-h-0">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-64 border-r shadow-lg" 
               style={{ 
                 maxHeight: 'calc(100vh - 120px)',
                 background: "var(--theme-floatingMenuBg)",
                 borderColor: "var(--theme-main)"
               }}>
          <h2 className="text-lg font-bold p-4 border-b" 
              style={{ 
                color: textColor,
                borderColor: "var(--theme-main)"
              }}>Your Recipes</h2>
          <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: 0 }}>
            {filteredRecipes.length === 0 && (
              <p className="text-center text-sm p-4" style={{ color: textColor, opacity: 0.6 }}>
                No recipes found. Add recipes to get started!
              </p>
            )}
            {filteredRecipes.map(recipe => (
              <div
                key={getRecipeId(recipe)}
                draggable
                onDragStart={() => setDraggedRecipe({
                  ...recipe,
                  icon: typeof recipe.icon === 'number' ? recipe.icon : 0,
                  description: recipe.description || '',
                  ingredients: recipe.ingredients || [],
                  instructions: recipe.instructions || []
                } as UserRecipe)}
                className="mb-3 p-3 rounded-lg shadow cursor-grab border hover:shadow-lg transition-shadow"
                style={{ 
                  background: recipe.color || "var(--theme-floatingMenuBg)",
                  borderColor: "var(--theme-main)"
                }}
              >
                <span className="font-semibold" style={{ color: textColor }}>{recipe.name}</span>
              </div>
            ))}
          </div>
        </aside>
        {/* Main planner grid */}
        <main className="flex-1 flex flex-col md:flex-row p-4 md:overflow-x-auto md:overflow-y-hidden min-h-0">
          <div className="flex flex-col md:flex-row w-full gap-4 md:gap-x-6 min-h-0">
            {days.map((day, dayIdx) => (
              <div
                key={day}
                className="flex flex-col md:w-1/7 w-full md:gap-4 gap-2 min-h-0 items-center p-3 rounded-xl shadow-md"
                style={{ 
                  background: "var(--theme-floatingMenuBg)",
                  borderWidth: 2,
                  borderStyle: "solid",
                  borderColor: "var(--theme-main)",
                }}
              >
                <h3 className="text-center text-md font-bold mb-2 mt-2 md:mt-0" 
                    style={{ color: textColor }}>{day}</h3>
                {meals.map(meal => {
                  const recipeId = mealPlan[dayIdx][meal as Meal];
                  const recipe = recipes.find(r => getRecipeId(r) === recipeId);
                  return (
                    <div
                      key={meal}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(dayIdx, meal as Meal)}
                      className="flex items-center justify-center md:min-h-[90px] min-h-[40px] max-h-[50px] rounded-lg shadow-md border-2 mb-2 relative group overflow-hidden w-full max-w-[180px] transition-all"
                      style={{ 
                        minWidth: 104, 
                        background: recipe ? "#fff" : "rgba(255,255,255,0.5)",
                        borderColor: recipe ? "var(--theme-main)" : "rgba(var(--theme-main-rgb, 109, 40, 217), 0.3)"
                      }}
                    >
                      {!recipe && (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs select-none pointer-events-none font-medium"
                              style={{ color: iconColor, opacity: 0.5 }}>
                          {meal}
                        </span>
                      )}
                      {recipe && (
                        <div className="flex flex-row items-center w-full h-full bg-white rounded shadow z-10" style={{ minHeight: 38 }}>
                          <div className="h-full w-2 rounded-l" style={{ background: recipe.color || "var(--theme-main)" }} />
                          <span className="ml-3 font-semibold truncate" style={{ lineHeight: 1.2, color: textColor }}>{recipe.name}</span>
                        </div>
                      )}
                      {recipe && deleteMode && (
                        <button
                          className="absolute top-1 right-1 text-xs text-red-500 hover:underline z-20"
                          onClick={() => handleRemove(dayIdx, meal as Meal)}
                          title="Remove recipe"
                        >
                          &#10006;
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </main>
        {/* Drawer (mobile) */}
        <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
          <button
            className="w-full py-2 font-semibold rounded-t-lg shadow-lg"
            style={{ background: "var(--theme-menuBarBg)", color: "var(--theme-pageHeading)" }}
            onClick={() => setSidebarOpen(o => !o)}
          >
            {sidebarOpen ? "Hide Recipes" : "Show Recipes"}
          </button>
          {sidebarOpen && (
            <div className="border-t max-h-60 overflow-y-auto p-2 flex gap-2" 
                 style={{ 
                   background: "var(--theme-floatingMenuBg)",
                   borderColor: "var(--theme-main)"
                 }}>
              {filteredRecipes.map(recipe => (
                <div
                  key={getRecipeId(recipe)}
                  draggable
                  onDragStart={() => setDraggedRecipe({
                    ...recipe,
                    icon: typeof recipe.icon === 'number' ? recipe.icon : 0,
                    description: recipe.description || '',
                    ingredients: recipe.ingredients || [],
                    instructions: recipe.instructions || []
                  } as UserRecipe)}
                  onTouchStart={e => {
                    const target = e.currentTarget;
                    const recipeToSet = {
                      ...recipe,
                      icon: typeof recipe.icon === 'number' ? recipe.icon : 0,
                      description: recipe.description || '',
                      ingredients: recipe.ingredients || [],
                      instructions: recipe.instructions || []
                    } as UserRecipe;
                    target.dataset.holdTimeout = String(window.setTimeout(() => setDraggedRecipe(recipeToSet), 300));
                  }}
                  onTouchEnd={e => {
                    const target = e.currentTarget;
                    if (target.dataset.holdTimeout) {
                      clearTimeout(Number(target.dataset.holdTimeout));
                      target.dataset.holdTimeout = '';
                    }
                  }}
                  className="min-w-[120px] p-3 rounded-lg shadow cursor-grab border hover:shadow-lg touch-manipulation transition-shadow"
                  style={{ 
                    background: recipe.color || "var(--theme-floatingMenuBg)",
                    borderColor: "var(--theme-main)"
                  }}
                >
                  <span className="font-semibold" style={{ color: textColor }}>{recipe.name}</span>
                  <span className="block text-xs mt-1" style={{ color: textColor, opacity: 0.6 }}>Hold to pick up</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
