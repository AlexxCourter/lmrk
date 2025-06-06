"use client";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { FaStar, FaPencilAlt, FaBars } from "react-icons/fa";
import ShoppingListModal from "@/components/ShoppingListModal";

type ShoppingListItem = {
  _id: string;
  name: string;
  checked?: boolean;
  quantity?: number;
};

type ShoppingList = {
  _id: string;
  name: string;
  color?: string;
  items: ShoppingListItem[];
};

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  shoppingLists?: ShoppingList[];
  activeList?: string;
};

export default function ShoppingListPage() {
  const { data: session, update } = useSession();
  const shoppingLists = (session?.user as SessionUser)?.shoppingLists || [];
  const activeListId = (session?.user as SessionUser)?.activeList;

  // Find the index of the active list, or default to 0 if none
  const defaultIdx =
    shoppingLists.length === 0
      ? null
      : activeListId
        ? shoppingLists.findIndex(
            (list: Record<string, unknown>) =>
              (list._id?.toString?.() || list._id) === (activeListId?.toString?.() || activeListId)
          )
        : 0;

  const [selectedIdx, setSelectedIdx] = useState<number | null>(defaultIdx);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const selectedList = selectedIdx !== null ? shoppingLists[selectedIdx] : null;
  const isActive = selectedList && (activeListId === (selectedList._id?.toString?.() || selectedList._id));

  // Ensure selectedIdx updates if activeListId or shoppingLists change
  useEffect(() => {
    if (shoppingLists.length === 0) {
      setSelectedIdx(null);
    } else if (activeListId) {
      const idx = shoppingLists.findIndex(
        (list: Record<string, unknown>) =>
          (list._id?.toString?.() || list._id) === (activeListId?.toString?.() || activeListId)
      );
      setSelectedIdx(idx >= 0 ? idx : 0);
    } else {
      setSelectedIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeListId, shoppingLists.length]);

  // Close sidebar on outside click or swipe left (mobile)
  useEffect(() => {
    if (!sidebarOpen) return;
    function handleClick(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    }
    let startX: number | null = null;
    function onTouchMove(ev: TouchEvent) {
      if (startX === null) startX = ev.touches[0].clientX;
      const diff = ev.touches[0].clientX - startX;
      if (diff < -50) { // swipe left
        setSidebarOpen(false);
        document.removeEventListener("touchmove", onTouchMove);
      }
    }
    function handleTouchStart() {
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", () => {
        document.removeEventListener("touchmove", onTouchMove);
      }, { once: true });
    }
    document.addEventListener("mousedown", handleClick as EventListener);
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [sidebarOpen]);

  // Handle checking/unchecking an item
  const handleCheck = async (itemIdx: number, checked: boolean) => {
    if (!selectedList || selectedIdx === null) return;
    setLoading(true);
    const listId = selectedList._id;
    const itemId = selectedList.items[itemIdx]._id;
    // Optimistically update UI
    shoppingLists[selectedIdx].items[itemIdx].checked = checked;
    // Save to DB
    await fetch("/api/shopping-lists/check-item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId,
        itemId,
        checked,
      }),
    });
    await update();
    setLoading(false);
  };

  // Toggle active shopping list (on/off)
  const handleToggleActive = async () => {
    if (!selectedList?._id) return;
    if (!isActive) {
      await fetch("/api/shopping-lists/set-active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: selectedList._id }),
      });
      await update();
    } else {
      // Turn off active list
      await fetch("/api/shopping-lists/set-active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: null }),
      });
      await update();
    }
  };

  // Handler for saving edited list
  const handleEditSave = async (updatedList: Record<string, unknown>) => {
    if (!selectedList?._id) return;
    await fetch("/api/shopping-lists/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId: selectedList._id,
        ...updatedList,
      }),
    });
    await update();
    setEditModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-800 to-purple-300">
      <div
        className="bg-white rounded-xl shadow-2xl flex w-full max-w-5xl min-h-[500px] relative flex-col md:flex-row md:relative"
        style={{
          marginTop: "max(8px, env(safe-area-inset-top, 0px))",
          marginBottom: "clamp(12px, 4vw, 32px)",
        }}
      >
        {/* Sidebar for desktop, hidden on mobile */}
        <div className="hidden md:flex w-64 border-r border-gray-200 p-6 flex-col">
          <h2 className="text-lg font-bold mb-4">My Shopping Lists</h2>
          {shoppingLists.length === 0 ? (
            <div className="text-gray-400 text-sm">No shopping lists yet.</div>
          ) : (
            <ul className="space-y-2 flex-1 overflow-y-auto">
              {shoppingLists.map((list: Record<string, unknown>, idx: number) => {
                const isListActive = activeListId === (list._id?.toString?.() || list._id);
                return (
                  <li
                    key={list._id ? String(list._id) : String(idx)}
                    className={`px-3 py-2 rounded cursor-pointer transition font-medium border-2 ${
                      selectedIdx === idx
                        ? "border-purple-700"
                        : "border-white"
                    } flex items-center justify-between`}
                    style={{
                      background: typeof list.color === "string" ? list.color : "#fff",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <span>{typeof list.name === "string" && list.name.length > 0 ? list.name : `List ${idx + 1}`}</span>
                    {isListActive && (
                      <FaStar className="ml-2 text-yellow-400 text-base" title="Active list" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Sidebar for mobile */}
        <div
          ref={sidebarRef}
          className={`
            fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 p-6 flex flex-col
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:hidden
          `}
          style={{ boxShadow: sidebarOpen ? "0 0 20px rgba(0,0,0,0.15)" : undefined }}
        >
          <h2 className="text-lg font-bold mb-4">My Shopping Lists</h2>
          {shoppingLists.length === 0 ? (
            <div className="text-gray-400 text-sm">No shopping lists yet.</div>
          ) : (
            <ul className="space-y-2 flex-1 overflow-y-auto">
              {shoppingLists.map((list: Record<string, unknown>, idx: number) => {
                const isListActive = activeListId === (list._id?.toString?.() || list._id);
                return (
                  <li
                    key={list._id ? String(list._id) : String(idx)}
                    className={`px-3 py-2 rounded cursor-pointer transition font-medium border-2 ${
                      selectedIdx === idx
                        ? "border-purple-700"
                        : "border-white"
                    } flex items-center justify-between`}
                    style={{
                      background: typeof list.color === "string" ? list.color : "#fff",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedIdx(idx);
                      setSidebarOpen(false);
                    }}
                  >
                    <span>{typeof list.name === "string" && list.name.length > 0 ? list.name : `List ${idx + 1}`}</span>
                    {isListActive && (
                      <FaStar className="ml-2 text-yellow-400 text-base" title="Active list" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Details */}
        <div className="flex-1 p-8 flex flex-col w-full">
          {/* Mobile controls row */}
          <div className="md:hidden flex items-center justify-between gap-3 mb-2">
            <button
              className="text-2xl text-purple-700 cursor-pointer"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>
            {selectedList && (
              <div className="flex items-center gap-3">
                {/* Toggle Switch for Set Active */}
                <label className="flex items-center cursor-pointer select-none">
                  <span className="mr-2 text-sm font-medium text-gray-700">Set Active</span>
                  <span className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!isActive}
                      onChange={handleToggleActive}
                    />
                    <span
                      className={`block w-10 h-6 rounded-full transition ${
                        isActive ? "bg-purple-700" : "bg-gray-300"
                      }`}
                    ></span>
                    <span
                      className={`dot absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition ${
                        isActive ? "translate-x-4" : ""
                      }`}
                      style={{
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        transition: "transform 0.2s",
                      }}
                    ></span>
                  </span>
                </label>
                {/* Pencil Icon for Edit */}
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium border border-purple-300 transition cursor-pointer"
                  title="Edit List"
                  onClick={() => setEditModalOpen(true)}
                  style={{ fontSize: 18 }}
                >
                  <FaPencilAlt />
                  <span className="text-sm">Edit</span>
                </button>
              </div>
            )}
          </div>
          {/* Mobile list name */}
          <div className="flex items-center mb-4 md:hidden">
            <h2 className="text-2xl font-bold flex-1">
              {selectedList?.name || "Shopping List"}
            </h2>
          </div>
          {/* Desktop details header */}
          {selectedList && (
            <div className="hidden md:flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedList.name || "Shopping List"}</h2>
              <div className="flex items-center gap-3">
                {/* Toggle Switch for Set Active */}
                <label className="flex items-center cursor-pointer select-none">
                  <span className="mr-2 text-sm font-medium text-gray-700">Set Active</span>
                  <span className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!isActive}
                      onChange={handleToggleActive}
                    />
                    <span
                      className={`block w-10 h-6 rounded-full transition ${
                        isActive ? "bg-purple-700" : "bg-gray-300"
                      }`}
                    ></span>
                    <span
                      className={`dot absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition ${
                        isActive ? "translate-x-4" : ""
                      }`}
                      style={{
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        transition: "transform 0.2s",
                      }}
                    ></span>
                  </span>
                </label>
                {/* Pencil Icon for Edit */}
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium border border-purple-300 transition cursor-pointer"
                  title="Edit List"
                  onClick={() => setEditModalOpen(true)}
                  style={{ fontSize: 18 }}
                >
                  <FaPencilAlt />
                  <span className="text-sm">Edit</span>
                </button>
              </div>
            </div>
          )}
          {selectedList ? (
            <>
              {selectedList.items && selectedList.items.length > 0 ? (
                <ul className="space-y-3">
                  {selectedList.items.map((item: Record<string, unknown>, idx: number) => (
                    <li key={item._id ? String(item._id) : String(idx)} className="flex items-center gap-3">
                      <input
                      type="checkbox"
                      checked={!!item.checked}
                      disabled={loading}
                      onChange={e => handleCheck(idx, e.target.checked)}
                      className="w-5 h-5 accent-purple-700"
                      />
                      <span
                      className={`text-lg font-semibold transition-all ${
                        item.checked
                        ? "text-gray-400 line-through"
                        : "text-gray-800"
                      }`}
                      >
                      {typeof item.name === "string"
                        ? item.name
                        : item.name !== undefined && item.name !== null
                        ? String(item.name)
                        : ""}
                      </span>
                      {item.quantity !== undefined && item.quantity !== null && (
                      <span className={`ml-2 text-base ${item.checked ? "text-gray-300" : "text-gray-600"}`}>
                        x{String(item.quantity)}
                      </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-400">No items in this list.</div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-lg flex-1 flex items-center justify-center">
              Select a list to view
            </div>
          )}
          {/* ShoppingListModal for editing */}
          {editModalOpen && selectedList && (
            <ShoppingListModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              initialData={{
                ...selectedList,
                items: selectedList.items?.map(item => ({
                  ...item,
                  quantity: item.quantity !== undefined ? String(item.quantity) : "",
                  checked: !!item.checked,
                })),
              }}
              onSave={handleEditSave}
              isEdit
            />
          )}
        </div>
      </div>
    </div>
  );
}
