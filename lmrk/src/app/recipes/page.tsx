"use client";
import { useState } from "react";
import { FaAppleAlt, FaShoppingCart } from "react-icons/fa";
import { useSession } from "next-auth/react";
import RecipeModal from "@/components/RecipeModal";
import { useRef } from "react";

// Extend the user type to include recipes
type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients?: { id: string; name: string; quantity?: string; unit?: string }[];
  instructions?: string[];
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

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [toastProgress, setToastProgress] = useState(0);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const toastInterval = useRef<NodeJS.Timeout | null>(null);

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
        }
        showToast(`${addedCount} items added to ${listName}`);
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
        const activeList = session.user.shoppingLists?.find(
          (list: Record<string, unknown>) =>
            (list._id?.toString?.() || list._id) ===
            (session?.user?.activeList?.toString?.() || session?.user?.activeList)
        );
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
          <h2 className="text-xl font-bold mb-4 text-gray-700">
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
              color: "#222",
              padding: "0.75rem 1.5rem",
              fontWeight: 500,
              fontSize: "1rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <span>{toast.message}</span>
            <button
              className="ml-2 text-gray-500 hover:text-gray-700 text-xl"
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
      <h1 className="text-2xl font-bold mb-8 text-white">My Recipes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {recipes.map((recipe: Record<string, unknown>) => (
          <div
            key={recipe.id as string}
            className="bg-white rounded-lg shadow p-4 flex flex-col justify-between cursor-pointer relative min-h-[220px] max-h-[220px] transition-transform hover:scale-105"
            style={{ minWidth: 240, maxWidth: 320, cursor: "pointer" }}
            onClick={() => setSelected(recipe)}
          >
            <div className="flex items-center gap-2 mb-2">
              <FaAppleAlt className="text-purple-700 text-xl" />
              <h2 className="text-lg font-bold">{typeof recipe.name === "string" ? recipe.name : ""}</h2>
            </div>
            <div className="text-gray-700 text-sm mb-2 flex-1">
              {typeof recipe.description === "string"
                ? recipe.description.slice(0, 100)
                : "No description provided."}
              {typeof recipe.description === "string" && recipe.description.length > 100 ? "..." : ""}
            </div>
            <div className="absolute bottom-3 left-4 text-xs text-gray-400">
              Click card for full recipe
            </div>
            <button
              className="absolute bottom-3 right-4 text-purple-700 hover:text-purple-900 text-xl cursor-pointer"
              title="Add ingredients to shopping list"
              onClick={e => {
                e.stopPropagation();
                handleAddToShoppingList(recipe.ingredients as Record<string, unknown>[] || []);
              }}
            >
              <FaShoppingCart />
            </button>
          </div>
        ))}
      </div>
      {/* Pop-up modal for recipe details */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-purple-700 text-3xl"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex items-center gap-2 mb-2">
              <FaAppleAlt className="text-purple-700 text-2xl" />
              <h2 className="text-xl font-bold">{typeof selected.name === "string" ? selected.name : ""}</h2>
            </div>
            <div className="mb-4 text-gray-700">
              {typeof selected.description === "string"
                ? selected.description
                : "No description provided."}
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Ingredients:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {(Array.isArray(selected.ingredients) ? selected.ingredients : []).map((ing: Record<string, unknown>) => (
                  <li key={ing.id as string}>
                    {String(ing.name)} - {String(ing.quantity ?? "")} {String(ing.unit ?? "")}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Instructions:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {(Array.isArray(selected.instructions) ? selected.instructions : []).map((step: string, idx: number) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
      {/* Recipe creation modal */}
      {showModal && (
        <RecipeModal open={showModal} onClose={() => setShowModal(false)} />
      )}
      {/* Spacer for floating menu */}
      <div style={{ height: 68 }} />
    </div>
  );
}
