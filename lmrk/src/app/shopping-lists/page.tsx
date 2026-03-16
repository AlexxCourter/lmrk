"use client";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeController } from "@/theme/ThemeController";
import { useState, useRef, useEffect } from "react";
import { FaStar, FaPencilAlt, FaBars, FaTrash, FaTimes } from "react-icons/fa";
import ShoppingListModal from "@/components/ShoppingListModal";
import { useUserData } from "@/components/UserDataProvider";

type ShoppingListItem = {
  _id: string;
  name: string;
  checked?: boolean;
  quantity?: string | number;
};

type ShoppingList = {
  _id: string;
  name: string;
  color?: string;
  items: ShoppingListItem[];
};

// Use Session from next-auth, which includes preferences

export default function ShoppingListPage() {
  const { data: sessionData, update } = useSession();
  const session = sessionData as Session | null;
  const { data: userData } = useUserData();
  
  // Get shopping lists from context
  const shoppingLists = userData?.shoppingLists || [];
  const activeListId = userData?.activeList;
  
  useEffect(() => {
    if (session?.user?.preferences?.theme) {
      const ctrl = ThemeController.getInstance();
      if (session.user.preferences.theme === "moonlight") ctrl.setMoonlight();
      else if (session.user.preferences.theme === "mint") ctrl.setMint();
      else ctrl.setDefault();
    }
  }, [session?.user?.preferences?.theme]);

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

  // Delete mode states
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const selectedList: ShoppingList | null = selectedIdx !== null ? shoppingLists[selectedIdx] : null;
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

  // Handle deleting selected lists
  const handleDelete = async () => {
    if (selectedForDeletion.length === 0) return;
    
    setDeleting(true);
    try {
      const res = await fetch("/api/shopping-lists/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listIds: selectedForDeletion }),
      });

      if (res.ok) {
        // Refresh session to get updated user data
        await update();
        
        // Reset states
        setShowDeleteConfirm(false);
        setDeleteMode(false);
        setSelectedForDeletion([]);
        
        // If we deleted the selected list, clear it
        if (selectedList && selectedForDeletion.includes(selectedList._id)) {
          setSelectedIdx(null);
        }
      } else {
        alert("Failed to delete shopping lists.");
      }
    } catch (error) {
      console.error("Error deleting lists:", error);
      alert("Failed to delete shopping lists.");
    } finally {
      setDeleting(false);
    }
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
            <>
              <ul className="space-y-2 flex-1 overflow-y-auto">
                {shoppingLists.map((list: Record<string, unknown>, idx: number) => {
                  const isListActive = activeListId === (list._id?.toString?.() || list._id);
                  const listId = list._id ? String(list._id) : String(idx);
                  const isSelectedForDeletion = deleteMode && selectedForDeletion.includes(listId);
                  return (
                    <li
                      key={listId}
                      className={`px-3 py-2 rounded cursor-pointer transition font-medium border-2 relative ${
                        deleteMode
                          ? isSelectedForDeletion
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                          : selectedIdx === idx
                            ? "border-purple-700"
                            : "border-white"
                      } flex items-center justify-between`}
                      style={{
                        background: deleteMode ? (isSelectedForDeletion ? undefined : "#fff") : (typeof list.color === "string" ? list.color : "#fff"),
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        if (deleteMode) {
                          // Toggle selection
                          if (isSelectedForDeletion) {
                            setSelectedForDeletion(prev => prev.filter(id => id !== listId));
                          } else {
                            setSelectedForDeletion(prev => [...prev, listId]);
                          }
                        } else {
                          setSelectedIdx(idx);
                        }
                      }}
                    >
                      {deleteMode && (
                        <div className="absolute top-2 right-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelectedForDeletion ? "bg-red-600" : "bg-red-100"
                          }`}>
                            <FaTimes className={isSelectedForDeletion ? "text-white" : "text-red-600"} size={10} />
                          </div>
                        </div>
                      )}
                      <span>{typeof list.name === "string" && list.name.length > 0 ? list.name : `List ${idx + 1}`}</span>
                      {!deleteMode && isListActive && (
                        <FaStar className="ml-2 text-yellow-400 text-base" title="Active list" />
                      )}
                    </li>
                  );
                })}
              </ul>
              
              {/* Delete button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {deleteMode ? (
                  <button
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 ${
                      selectedForDeletion.length > 0
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => {
                      if (selectedForDeletion.length > 0) {
                        setShowDeleteConfirm(true);
                      } else {
                        setDeleteMode(false);
                      }
                    }}
                  >
                    {selectedForDeletion.length > 0 ? (
                      <>Delete {selectedForDeletion.length} List{selectedForDeletion.length !== 1 ? "s" : ""}</>
                    ) : (
                      <>Cancel</>
                    )}
                  </button>
                ) : (
                  <button
                    className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition text-sm flex items-center justify-center gap-2"
                    onClick={() => {
                      setDeleteMode(true);
                      setSelectedForDeletion([]);
                    }}
                  >
                    <FaTrash /> Delete Lists
                  </button>
                )}
              </div>
            </>
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
            <>
              <ul className="space-y-2 flex-1 overflow-y-auto">
                {shoppingLists.map((list: Record<string, unknown>, idx: number) => {
                  const isListActive = activeListId === (list._id?.toString?.() || list._id);
                  const listId = list._id ? String(list._id) : String(idx);
                  const isSelectedForDeletion = deleteMode && selectedForDeletion.includes(listId);
                  return (
                    <li
                      key={listId}
                      className={`px-3 py-2 rounded cursor-pointer transition font-medium border-2 relative ${
                        deleteMode
                          ? isSelectedForDeletion
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                          : selectedIdx === idx
                            ? "border-purple-700"
                            : "border-white"
                      } flex items-center justify-between`}
                      style={{
                        background: deleteMode ? (isSelectedForDeletion ? undefined : "#fff") : (typeof list.color === "string" ? list.color : "#fff"),
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        if (deleteMode) {
                          // Toggle selection
                          if (isSelectedForDeletion) {
                            setSelectedForDeletion(prev => prev.filter(id => id !== listId));
                          } else {
                            setSelectedForDeletion(prev => [...prev, listId]);
                          }
                        } else {
                          setSelectedIdx(idx);
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      {deleteMode && (
                        <div className="absolute top-2 right-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelectedForDeletion ? "bg-red-600" : "bg-red-100"
                          }`}>
                            <FaTimes className={isSelectedForDeletion ? "text-white" : "text-red-600"} size={10} />
                          </div>
                        </div>
                      )}
                      <span>{typeof list.name === "string" && list.name.length > 0 ? list.name : `List ${idx + 1}`}</span>
                      {!deleteMode && isListActive && (
                        <FaStar className="ml-2 text-yellow-400 text-base" title="Active list" />
                      )}
                    </li>
                  );
                })}
              </ul>
              
              {/* Delete button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {deleteMode ? (
                  <button
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 ${
                      selectedForDeletion.length > 0
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => {
                      if (selectedForDeletion.length > 0) {
                        setShowDeleteConfirm(true);
                        setSidebarOpen(false);
                      } else {
                        setDeleteMode(false);
                      }
                    }}
                  >
                    {selectedForDeletion.length > 0 ? (
                      <>Delete {selectedForDeletion.length} List{selectedForDeletion.length !== 1 ? "s" : ""}</>
                    ) : (
                      <>Cancel</>
                    )}
                  </button>
                ) : (
                  <button
                    className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition text-sm flex items-center justify-center gap-2"
                    onClick={() => {
                      setDeleteMode(true);
                      setSelectedForDeletion([]);
                    }}
                  >
                    <FaTrash /> Delete Lists
                  </button>
                )}
              </div>
            </>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <FaTimes className="text-gray-600" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="text-red-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-black">Delete Lists?</h2>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete {selectedForDeletion.length} shopping list{selectedForDeletion.length !== 1 ? "s" : ""}? This action cannot be undone and {selectedForDeletion.length !== 1 ? "these lists" : "this list"} will be permanently removed from your account.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? "Deleting..." : (
                  <>
                    <FaTrash />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
