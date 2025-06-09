"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { FaPlus, FaAppleAlt, FaListUl, FaUtensils, FaShoppingCart } from "react-icons/fa";
import RecipeModal from "@/components/RecipeModal";
import ShoppingListModal from "@/components/ShoppingListModal";

export default function FloatingMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close create menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCreate(false);
      }
    }
    if (showCreate) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCreate]);

  if (!session?.user) return null;

  // Find active list and count unchecked items
  type UserWithLists = typeof session.user & {
    activeList?: string;
    shoppingLists?: Record<string, unknown>[];
  };
  const user = session.user as UserWithLists;
  const activeListId = user.activeList;
  const shoppingLists = user.shoppingLists || [];
  const activeList = shoppingLists.find(
    (list: Record<string, unknown>) =>
      (list._id?.toString?.() || list._id) === (activeListId?.toString?.() || activeListId)
  );
  const uncheckedCount =
    activeList && Array.isArray(activeList.items)
      ? (activeList.items as Record<string, unknown>[]).filter((item: Record<string, unknown>) => !item.checked).length
      : 0;

  return (
    <>
      {/* Dimmed overlay when create menu is open */}
      {showCreate && (
        <div
          className="fixed inset-0 z-40 bg-black transition-opacity"
          style={{ background: "rgba(0,0,0,0.30)" }} // much lighter dim
          onClick={() => setShowCreate(false)}
          aria-hidden="true"
        />
      )}
      <div
        ref={menuRef}
        className="fixed bottom-15 left-1/2 -translate-x-1/2 z-50 bg-white border-3 border-purple-700 rounded-xl shadow-md shadow-gray-700 flex items-center justify-between px-2"
        style={{ height: 56, minHeight: 56, maxHeight: 56, minWidth: 200, width: 200 }}
      >
        <button
          className="flex items-center justify-center text-purple-700 hover:text-purple-900 transition cursor-pointer"
          style={{ fontSize: 32, width: 48, height: 48 }}
          aria-label="Recipes"
          onClick={() => router.push("/recipes")}
        >
          <FaUtensils />
        </button>
        <div className="relative flex items-center justify-center" style={{ flex: "0 0 56px" }}>
          <button
            className="bg-purple-700 text-white font-bold rounded-full flex items-center justify-center border-4 hover:bg-purple-900 transition duration-200 ease-in-out cursor-pointer"
            style={{
              width: 60,
              height: 60,
              fontSize: 32,
              position: "absolute",
              top: -30,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(109,40,217,0.15)",
              border: "3px solid white",
            }}
            aria-label="Create"
            onClick={() => setShowCreate((v) => !v)}
          >
            <FaPlus />
          </button>
          {showCreate && (
            <div
              className="absolute z-50 flex flex-col items-start"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 50, // slightly closer to the floating menu
                gap: 8,     // tighter spacing between buttons
              }}
            >
              {/* New Recipe Button with label */}
              <div className="flex items-center animate-float-pop">
                <button
                  className="bg-white border-2 border-purple-700 text-purple-700 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-200 cursor-pointer"
                  style={{ width: 48, height: 48, fontSize: 22 }}
                  aria-label="Create Recipe"
                  onClick={() => {
                    setShowCreate(false);
                    setShowRecipeModal(true);
                  }}
                >
                  <FaAppleAlt />
                </button>
                <span className="ml-3 text-xs font-semibold text-purple-700 bg-white bg-opacity-90 px-2 py-0.5 rounded shadow whitespace-nowrap">
                  New Recipe
                </span>
              </div>
              {/* New List Button with label */}
              <div className="flex items-center animate-float-pop" style={{ marginTop: 2 }}>
                <button
                  className="bg-white border-2 border-purple-700 text-purple-700 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-200 cursor-pointer"
                  style={{ width: 48, height: 48, fontSize: 22 }}
                  aria-label="Create Shopping List"
                  onClick={() => {
                    setShowCreate(false);
                    setShowShoppingModal(true);
                  }}
                >
                  <FaListUl />
                </button>
                <span className="ml-3 text-xs font-semibold text-purple-700 bg-white bg-opacity-90 px-2 py-0.5 rounded shadow whitespace-nowrap">
                  New List
                </span>
              </div>
              <style jsx global>{`
                @keyframes floatPop {
                  0% {
                    opacity: 0;
                    transform: translateY(20px) scale(0.7);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
                .animate-float-pop {
                  animation: floatPop 0.25s cubic-bezier(.4,1.7,.6,.95);
                }
              `}</style>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            className="flex items-center justify-center text-purple-700 hover:text-purple-900 transition cursor-pointer"
            style={{ fontSize: 32, width: 48, height: 48 }}
            aria-label="Lists"
            onClick={() => router.push("/shopping-lists")}
          >
            <FaShoppingCart />
            {uncheckedCount > 0 && (
              <span
                className="absolute"
                style={{
                  top: 6,
                  right: 6,
                  background: "linear-gradient(135deg, #ff512f 0%, #ff9966 100%)",
                  color: "white",
                  borderRadius: "9999px",
                  minWidth: 18,
                  height: 18,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                  border: "2px solid white",
                  zIndex: 20,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  pointerEvents: "none",
                }}
              >
                {uncheckedCount}
              </span>
            )}
          </button>
        </div>
      </div>
      {showRecipeModal && (
        <RecipeModal open={showRecipeModal} onClose={() => setShowRecipeModal(false)} />
      )}
      {showShoppingModal && (
        <ShoppingListModal open={showShoppingModal} onClose={() => setShowShoppingModal(false)} />
      )}
    </>
  );
}
