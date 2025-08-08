"use client";
import { useState, useMemo } from "react";
import { FaTrash, FaSearch } from "react-icons/fa";
import type { Recipe as UserRecipe } from "../../models/User";
import { ObjectId } from "mongodb";
import { useSession } from "next-auth/react";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const meals = ["BREAKFAST", "LUNCH", "DINNER"];

// Dummy recipes for sidebar (replace with real data fetch later)
const dummyRecipes = [
  { id: "1", name: "Pancakes", color: "#f3e8ff" },
  { id: "2", name: "Chicken Salad", color: "#dbeafe" },
  { id: "3", name: "Spaghetti", color: "#fee2e2" },
  { id: "4", name: "Tacos", color: "#fef9c3" },
  { id: "5", name: "Veggie Stir Fry", color: "#bbf7d0" },
];

type Meal = "BREAKFAST" | "LUNCH" | "DINNER";
type DayPlan = Record<Meal, string | null>;

export default function MealPlannerPage() {
  const { data: sessionData } = useSession();
  // Session type is flexible, fallback to empty array if not present
  const userRecipes = (sessionData?.user && 'recipes' in sessionData.user ? (sessionData.user as { recipes?: UserRecipe[] }).recipes : []) || [];

  // Helper to get a string id for any recipe (ObjectId or string)
  function getRecipeId(recipe: UserRecipe): string {
    if (!recipe._id) return "";
    if (typeof recipe._id === "string") return recipe._id;
    // fallback for ObjectId
    return recipe._id.toString();
  }

  // Use real user recipes if available, otherwise fallback to dummy
  const recipes: UserRecipe[] = userRecipes.length > 0
    ? userRecipes
    : dummyRecipes.map(r => ({
        _id: r.id as unknown as ObjectId, // fudge for local dummy
        name: r.name,
        icon: 0,
        description: "",
        ingredients: [],
        instructions: [],
        mealType: undefined,
        tags: [],
        color: r.color,
      }));

  const [mealPlan, setMealPlan] = useState<DayPlan[]>(
    () => days.map(() => ({ BREAKFAST: null, LUNCH: null, DINNER: null }))
  );
  const [draggedRecipe, setDraggedRecipe] = useState<UserRecipe | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Responsive: show sidebar or drawer
  // const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      {/* Meal planner toolbar - now matches meal planner width */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-white shadow-sm border-b border-purple-100 mb-2 mx-auto max-w-[1600px]" style={{ minHeight: 40 }}>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-purple-100"
            title="Search Recipes"
            onClick={() => setSearchOpen(o => !o)}
          >
            <FaSearch className="text-purple-500 text-lg" />
          </button>
          {searchOpen && (
            <input
              autoFocus
              type="text"
              className="ml-2 px-2 py-1 border border-purple-200 rounded focus:outline-none focus:ring focus:border-purple-400 text-sm"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ minWidth: 180 }}
            />
          )}
        </div>
        <button
          className={`p-2 rounded-full hover:bg-red-100 ${deleteMode ? "bg-red-200" : ""}`}
          title="Delete Mode"
          onClick={() => setDeleteMode(d => !d)}
        >
          <FaTrash className="text-red-500 text-lg" />
        </button>
      </div>
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto min-h-0">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-purple-200 shadow-lg" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <h2 className="text-lg font-bold p-4 border-b border-purple-100">Your Recipes</h2>
          <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: 0 }}>
            {filteredRecipes.map(recipe => (
              <div
                key={getRecipeId(recipe)}
                draggable
                onDragStart={() => setDraggedRecipe(recipe)}
                className="mb-3 p-3 rounded-lg shadow cursor-grab bg-white border border-purple-100 hover:bg-purple-50"
                style={{ background: recipe.color }}
              >
                <span className="font-semibold text-gray-800">{recipe.name}</span>
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
                className="flex flex-col md:w-1/7 w-full bg-transparent md:gap-4 gap-2 min-h-0 items-center"
                style={{ background: 'rgba(245,245,255,0.7)', borderRadius: 12, boxShadow: '0 1px 4px 0 #ede9fe' }}
              >
                <h3 className="text-center text-md font-bold text-purple-700 mb-2 mt-2 md:mt-0">{day}</h3>
                {meals.map(meal => {
                  const recipeId = mealPlan[dayIdx][meal as Meal];
                  const recipe = recipes.find(r => getRecipeId(r) === recipeId);
                  return (
                    <div
                      key={meal}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(dayIdx, meal as Meal)}
                      className="flex items-center justify-center md:min-h-[90px] min-h-[40px] max-h-[50px] bg-white rounded-lg shadow-inner border border-purple-100 mb-2 relative group overflow-hidden w-full max-w-[180px]"
                      style={{ minWidth: 104, boxShadow: "0 2px 8px 0 #ede9fe, inset 0 2px 8px #ede9fe" }}
                    >
                      {!recipe && (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-purple-400 select-none pointer-events-none">
                          {meal}
                        </span>
                      )}
                      {recipe && (
                        <div className="flex flex-row items-center w-full h-full bg-white rounded shadow z-10" style={{ minHeight: 38 }}>
                          <div className="h-full w-2 rounded-l" style={{ background: recipe.color || '#ede9fe' }} />
                          <span className="ml-3 font-semibold text-gray-800 truncate" style={{ lineHeight: 1.2 }}>{recipe.name}</span>
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
            className="w-full bg-purple-700 text-white py-2 font-semibold rounded-t-lg shadow-lg"
            onClick={() => setSidebarOpen(o => !o)}
          >
            {sidebarOpen ? "Hide Recipes" : "Show Recipes"}
          </button>
          {sidebarOpen && (
            <div className="bg-white border-t border-purple-200 max-h-60 overflow-y-auto p-2 flex gap-2">
              {filteredRecipes.map(recipe => (
                <div
                  key={getRecipeId(recipe)}
                  draggable
                  onDragStart={() => setDraggedRecipe(recipe)}
                  onTouchStart={e => {
                    const target = e.currentTarget;
                    target.dataset.holdTimeout = String(window.setTimeout(() => setDraggedRecipe(recipe), 300));
                  }}
                  onTouchEnd={e => {
                    const target = e.currentTarget;
                    if (target.dataset.holdTimeout) {
                      clearTimeout(Number(target.dataset.holdTimeout));
                      target.dataset.holdTimeout = '';
                    }
                  }}
                  className="min-w-[120px] p-3 rounded-lg shadow cursor-grab bg-white border border-purple-100 hover:bg-purple-50 touch-manipulation"
                  style={{ background: recipe.color }}
                >
                  <span className="font-semibold text-gray-800">{recipe.name}</span>
                  <span className="block text-xs text-gray-400 mt-1">Hold to pick up</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
