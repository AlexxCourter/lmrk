"use client";
import { FaPlus, FaChevronRight } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RecipeModal from "@/components/RecipeModal";
import ShoppingListModal from "@/components/ShoppingListModal";
import { ICONS as RECIPE_ICONS } from "@/components/RecipeModal"; // Reuse icon list
import { ThemeController } from "@/theme/ThemeController";

export default function ToolsCards({
  recipes,
  shoppingLists,
  user,
}: {
  recipes: Record<string, unknown>[];
  shoppingLists: Record<string, unknown>[];
  user?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [themeColors, setThemeColors] = useState({ main: "#6d28d9", menuBarBg: "#6d28d9" });

  useEffect(() => {
    const ctrl = ThemeController.getInstance();
    setThemeColors(ctrl.colors);
  }, []);

  // Defensive: ensure recipes is always an array
  const recipeList = Array.isArray(recipes) ? recipes : [];
  // Family share state - check user.groupInfo?.groupEnabled
  const groupInfo = user?.groupInfo as { groupEnabled?: boolean } | undefined;
  const familyShareEnabled = !!groupInfo?.groupEnabled;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recipes Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[220px]">
          {/* Family Share Section */}
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2" style={{ color: themeColors.main }}>Family Share</h3>
            {!familyShareEnabled ? (
              <div className="text-gray-500 text-sm">Enable family share to create your family cook book.</div>
            ) : (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer group transition"
                style={{ 
                  borderColor: themeColors.main,
                  background: `${themeColors.main}10`
                }}
                onClick={() => router.push("/family/book")}
                tabIndex={0}
                role="button"
                aria-label="Go to Family cook book"
                onMouseEnter={(e) => (e.currentTarget.style.background = `${themeColors.main}20`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = `${themeColors.main}10`)}
              >
                <span className="text-2xl">📖</span>
                <span className="flex-1 font-semibold text-base truncate" style={{ color: themeColors.main }}>
                  Family cook book
                </span>
                <FaChevronRight className="text-lg" style={{ color: themeColors.main, opacity: 0.6 }} />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold mb-4" style={{ color: themeColors.main }}>Recipes</h2>
          <div className="flex-1">
            {recipeList.length > 0 ? (
              <ul className="space-y-2">
                {recipeList.slice(0, 5).map((recipe: Record<string, unknown>, idx: number) => {
                  const Icon = RECIPE_ICONS?.[recipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
                  return (
                    <li
                      key={recipe._id as string || idx}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white transition cursor-pointer group"
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push("/recipes")}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = themeColors.menuBarBg;
                        e.currentTarget.style.color = "#fff";
                        const icon = e.currentTarget.querySelector('.chevron-icon') as HTMLElement;
                        if (icon) icon.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "";
                        const icon = e.currentTarget.querySelector('.chevron-icon') as HTMLElement;
                        if (icon) icon.style.color = "#9ca3af";
                      }}
                    >
                      <span className="text-2xl">
                        <Icon />
                      </span>
                      <span className="flex-1 font-semibold text-base truncate">
                        {recipe.name as string}
                      </span>
                      <FaChevronRight className="text-lg text-gray-400 chevron-icon" />
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
              className="text-white px-4 py-2 rounded font-semibold transition text-sm cursor-pointer"
              style={{ background: themeColors.menuBarBg }}
              onClick={() => router.push("/recipes")}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              My Recipes
            </button>
            <button
              className="text-white rounded-full p-2 transition flex items-center justify-center cursor-pointer"
              style={{ width: 36, height: 36, background: themeColors.menuBarBg }}
              aria-label="Create Recipe"
              onClick={() => setShowModal(true)}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <FaPlus />
            </button>
          </div>
        </div>
        {/* Shopping Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[220px]">
          <h2 className="text-xl font-bold mb-4" style={{ color: themeColors.main }}>Shopping</h2>
          <div className="flex-1">
            {shoppingLists && shoppingLists.length > 0 ? (
              <>
                {/* Active Shopping List Section */}
                {(() => {
                  // Find the active list by matching user.activeList to shopping list _id
                  const activeListId = user?.activeList;
                  const activeList = activeListId
                    ? shoppingLists.find((l: Record<string, unknown>) => l._id?.toString() === activeListId?.toString())
                    : undefined;
                  // Sort all lists by dateCreated descending
                  const sortedLists = shoppingLists.slice().sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
                    const aDate = new Date(a.dateCreated as string || 0).getTime();
                    const bDate = new Date(b.dateCreated as string || 0).getTime();
                    return bDate - aDate;
                  });
                  // Exclude the active list from recent lists (by _id)
                  const recentLists = sortedLists.filter((list: Record<string, unknown>) => !activeList || list._id !== activeList._id).slice(0, 3);
                  return (
                    <>
                      {activeList && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-gray-500 mb-1">currently active shopping list</div>
                          <ul>
                            <li
                              key={activeList._id as string}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer group transition"
                              style={{
                                background: typeof activeList.color === "string" ? activeList.color : `${themeColors.main}10`,
                                borderColor: themeColors.main,
                                cursor: "pointer",
                              }}
                              onClick={() => router.push("/shopping-lists")}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <span className="flex-1 font-semibold text-base truncate" style={{ color: themeColors.main }}>
                                {activeList.name as string}
                              </span>
                              <FaChevronRight className="text-lg" style={{ color: themeColors.main, opacity: 0.6 }} />
                            </li>
                          </ul>
                        </div>
                      )}
                      {/* Recent Lists Section */}
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">recent lists</div>
                        <ul className="space-y-2">
                          {recentLists.map((list: Record<string, unknown>, idx: number) => (
                            <li
                              key={list._id as string || idx}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 cursor-pointer group transition"
                              style={{
                                background: typeof list.color === "string" ? list.color : "#fff",
                                cursor: "pointer",
                              }}
                              onClick={() => router.push("/shopping-lists")}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = themeColors.main;
                                const icon = e.currentTarget.querySelector('.chevron-recent') as HTMLElement;
                                if (icon) icon.style.color = themeColors.main;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#e5e7eb";
                                const icon = e.currentTarget.querySelector('.chevron-recent') as HTMLElement;
                                if (icon) icon.style.color = "#9ca3af";
                              }}
                            >
                              <span className="flex-1 font-semibold text-base truncate text-gray-800">
                                {list.name as string}
                              </span>
                              <FaChevronRight className="text-lg text-gray-400 chevron-recent" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="text-gray-500">No shopping lists yet! Add items to get started.</div>
            )}
          </div>
          <div className="h-8" /> {/* Spacer to ensure buttons don't overlap text */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              className="text-white px-4 py-2 rounded font-semibold transition text-sm cursor-pointer"
              style={{ background: themeColors.menuBarBg }}
              onClick={() => router.push("/shopping-lists")}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              My Lists
            </button>
            <button
              className="text-white rounded-full p-2 transition flex items-center justify-center cursor-pointer"
              style={{ width: 36, height: 36, background: themeColors.menuBarBg }}
              aria-label="Create Shopping List"
              onClick={() => setShowShoppingModal(true)}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
