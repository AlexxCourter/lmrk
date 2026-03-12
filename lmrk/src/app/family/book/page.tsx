"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserData } from "@/components/UserDataProvider";
import { FaChevronLeft, FaPlus, FaTimes, FaUtensils, FaShoppingCart, FaPencilAlt, FaTrash } from "react-icons/fa";
import RecipeModal from "@/components/RecipeModal";
import { ICONS as RECIPE_ICONS } from "@/components/RecipeModal";
import ShoppingListModal from "@/components/ShoppingListModal";

export default function FamilyCookBookPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { data: userData } = useUserData();
  const [groupInfo, setGroupInfo] = useState<{ 
    cookBook?: { _id?: string; name: string; icon?: number; description?: string; color?: string; mealType?: string; tags?: string[]; ingredients?: unknown[]; instructions?: unknown[] }[]; 
    shoppingLists?: { _id?: string; name: string; color?: string; dateCreated?: string; items?: { _id?: string; name: string; quantity?: string; checked?: boolean }[] }[];
    members?: { id: string; username?: string; email: string; profileImage?: string }[];
  } | null>(null);
  const [, setLoadingGroupInfo] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStep, setAddModalStep] = useState<"choice" | "create" | "select">("choice");
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [addingRecipes, setAddingRecipes] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // View mode: "recipes" or "lists"
  const [viewMode, setViewMode] = useState<"recipes" | "lists">("recipes");
  
  // Recipe modal
  const [selectedRecipe, setSelectedRecipe] = useState<{ _id?: string; id?: string; name: string; icon?: number; description?: string; color?: string; mealType?: string; tags?: string[]; ingredients?: unknown[]; instructions?: unknown[] } | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  
  // Shopping list states
  const [selectedShoppingList, setSelectedShoppingList] = useState<{ _id?: string; name: string; color?: string; items?: { _id?: string; name: string; quantity?: string; checked?: boolean }[] } | null>(null);
  const [showListAddModal, setShowListAddModal] = useState(false);
  const [listAddStep, setListAddStep] = useState<"choice" | "create" | "select">("choice");
  const [selectedUserLists, setSelectedUserLists] = useState<string[]>([]);
  const [addingLists, setAddingLists] = useState(false);
  const [showListSuccess, setShowListSuccess] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  
  // Recipe to shopping list modal states
  const [showRecipeToListModal, setShowRecipeToListModal] = useState(false);
  const [recipeToAdd, setRecipeToAdd] = useState<{ _id?: string; id?: string; name: string; ingredients?: unknown[] } | null>(null);
  const [selectedTargetListId, setSelectedTargetListId] = useState<string>("");
  const [sendingToList, setSendingToList] = useState(false);
  const [showAddToListSuccess, setShowAddToListSuccess] = useState(false);

  // Delete mode states
  const [deleteMode, setDeleteMode] = useState<"recipes" | "lists" | null>(null);
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Recipe detail view (not edit)
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);

  const user = session?.user as { groupInfo?: { groupEnabled?: boolean } };
  const familyEnabled = !!user?.groupInfo?.groupEnabled;

  const fetchGroupInfo = useCallback(async () => {
    setLoadingGroupInfo(true);
    try {
      const response = await fetch("/api/family/get-group-info");
      if (response.ok) {
        const data = await response.json();
        setGroupInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch group info:", error);
    } finally {
      setLoadingGroupInfo(false);
    }
  }, []);

  // Fetch group info when component mounts
  useEffect(() => {
    if (familyEnabled) {
      fetchGroupInfo();
    }
  }, [familyEnabled, fetchGroupInfo]);

  // Polling for real-time updates - faster polling and works on both tabs
  useEffect(() => {
    if (!familyEnabled) return;
    
    const interval = setInterval(() => {
      fetchGroupInfo();
    }, 1500); // Poll every 1.5 seconds for near-instant updates
    
    return () => clearInterval(interval);
  }, [familyEnabled, fetchGroupInfo]);

  async function handleAddRecipes() {
    if (selectedRecipes.length === 0) return;
    
    setAddingRecipes(true);
    try {
      const response = await fetch("/api/family/add-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: selectedRecipes }),
      });

      if (response.ok) {
        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Refresh group info to get updated cookbook
        await fetchGroupInfo();
        
        // Close modal and reset
        setShowAddModal(false);
        setAddModalStep("choice");
        setSelectedRecipes([]);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add recipes");
      }
    } catch (error) {
      console.error("Failed to add recipes:", error);
      alert("Failed to add recipes. Please try again.");
    } finally {
      setAddingRecipes(false);
    }
  }

  async function handleAddLists() {
    if (selectedUserLists.length === 0) return;
    
    setAddingLists(true);
    try {
      const response = await fetch("/api/family/add-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listIds: selectedUserLists }),
      });

      if (response.ok) {
        // Show success message
        setShowListSuccess(true);
        setTimeout(() => setShowListSuccess(false), 3000);
        
        // Refresh group info to get updated shopping lists
        await fetchGroupInfo();
        
        // Close modal and reset
        setShowListAddModal(false);
        setListAddStep("choice");
        setSelectedUserLists([]);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add shopping lists");
      }
    } catch (error) {
      console.error("Failed to add shopping lists:", error);
      alert("Failed to add shopping lists. Please try again.");
    } finally {
      setAddingLists(false);
    }
  }

  async function handleCreateNewList(listData: Record<string, unknown>) {
    try {
      // Save the new list to user's collection first
      const response = await fetch("/api/shopping-lists/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData),
      });

      if (!response.ok) {
        throw new Error("Failed to create shopping list");
      }

      const result = await response.json();
      const newListId = result.shoppingList?._id?.toString() || result.shoppingList?.id?.toString();

      if (!newListId) {
        throw new Error("No list ID returned");
      }

      // Update session to get the new list in userData
      await update();

      // Small delay to ensure session is fully updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now add it to the family share
      const familyResponse = await fetch("/api/family/add-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listIds: [newListId] }),
      });

      if (familyResponse.ok) {
        // Show success message
        setShowListSuccess(true);
        setTimeout(() => setShowListSuccess(false), 3000);
        
        // Refresh group info
        await fetchGroupInfo();
        
        // Close modals and reset - DO NOT redirect
        setShowCreateListModal(false);
        setShowListAddModal(false);
        setListAddStep("choice");
      } else {
        const error = await familyResponse.json();
        alert(error.error || "Failed to add list to family share");
      }
    } catch (error) {
      console.error("Failed to create and share list:", error);
      alert("Failed to create shopping list. Please try again.");
    }
  }

  async function handleSendRecipeToShoppingList() {
    if (!recipeToAdd || !selectedTargetListId) return;
    
    setSendingToList(true);
    try {
      const recipeId = recipeToAdd._id || recipeToAdd.id;
      const response = await fetch("/api/family/add-recipe-to-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          recipeId,
          listId: selectedTargetListId 
        }),
      });

      if (response.ok) {
        // Immediately refresh to show new items
        await fetchGroupInfo();
        
        // Show success message
        setShowAddToListSuccess(true);
        setTimeout(() => setShowAddToListSuccess(false), 3000);
        
        // Close modal and reset
        setShowRecipeToListModal(false);
        setRecipeToAdd(null);
        setSelectedTargetListId("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add recipe to shopping list");
      }
    } catch (error) {
      console.error("Failed to add recipe to shopping list:", error);
      alert("Failed to add recipe to shopping list. Please try again.");
    } finally {
      setSendingToList(false);
    }
  }

  async function handleDelete() {
    if (selectedForDeletion.length === 0) return;
    
    setDeleting(true);
    try {
      const endpoint = deleteMode === "recipes" 
        ? "/api/family/delete-recipes" 
        : "/api/family/delete-lists";
      
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ids: selectedForDeletion 
        }),
      });

      if (response.ok) {
        // Refresh group info
        await fetchGroupInfo();
        
        // Reset states
        setShowDeleteConfirm(false);
        setDeleteMode(null);
        setSelectedForDeletion([]);
        
        // If we deleted the selected shopping list, clear it
        if (deleteMode === "lists" && selectedShoppingList && selectedForDeletion.includes(selectedShoppingList._id || '')) {
          setSelectedShoppingList(null);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete items");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete items. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCheckSharedItem(listId: string, itemId: string, currentChecked: boolean) {
    // Optimistically update the UI
    setGroupInfo(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        shoppingLists: prev.shoppingLists?.map(list => {
          if (list._id?.toString() !== listId) return list;
          return {
            ...list,
            items: list.items?.map(item => {
              if (item._id?.toString() !== itemId) return item;
              return { ...item, checked: !currentChecked };
            })
          };
        })
      };
    });

    // Also update the selected list if it's the one being modified
    if (selectedShoppingList?._id === listId) {
      setSelectedShoppingList(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items?.map(item => {
            if (item._id?.toString() !== itemId) return item;
            return { ...item, checked: !currentChecked };
          })
        };
      });
    }

    // Send update to server
    try {
      const response = await fetch("/api/family/check-list-item", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId,
          itemId,
          checked: !currentChecked,
          lastModified: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          // Conflict - someone else modified it, refresh to get latest
          console.log("Conflict detected, refreshing...");
          await fetchGroupInfo();
        } else {
          console.error("Failed to update item:", error);
          // Revert optimistic update on error
          await fetchGroupInfo();
        }
      }
    } catch (error) {
      console.error("Error updating item:", error);
      // Revert optimistic update on error
      await fetchGroupInfo();
    }
  }

  const familyRecipes = groupInfo?.cookBook || [];
  const familyShoppingLists = (groupInfo?.shoppingLists || []).sort((a, b) => {
    // Sort by dateCreated, most recent first
    const dateA = new Date(a.dateCreated || 0).getTime();
    const dateB = new Date(b.dateCreated || 0).getTime();
    return dateB - dateA;
  });
  const userRecipes = userData?.recipes || [];
  const userShoppingLists = userData?.shoppingLists || [];

  // Auto-select first shopping list when switching to lists view
  useEffect(() => {
    if (viewMode === "lists" && familyShoppingLists.length > 0 && !selectedShoppingList) {
      setSelectedShoppingList(familyShoppingLists[0]);
    }
  }, [viewMode, familyShoppingLists, selectedShoppingList]);

  // Sync selectedShoppingList with updated groupInfo data
  useEffect(() => {
    if (selectedShoppingList && familyShoppingLists.length > 0) {
      const updatedList = familyShoppingLists.find(
        (list: { _id?: string }) => list._id === selectedShoppingList._id
      );
      if (updatedList) {
        // Update with the latest data from groupInfo
        setSelectedShoppingList(updatedList);
      }
    }
    // Only depend on familyShoppingLists to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyShoppingLists]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-100 to-purple-300">
      <div className="max-w-6xl mx-auto w-full p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-full bg-white shadow hover:bg-purple-100 transition"
              onClick={() => router.back()}
              aria-label="Back"
            >
              <FaChevronLeft className="text-purple-700" />
            </button>
            <h1 className="text-2xl font-bold text-purple-900">Family Cook Book</h1>
            
            {/* View Toggle Icons */}
            {familyEnabled && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setViewMode("recipes")}
                  className={`p-3 rounded-full transition-all ${
                    viewMode === "recipes"
                      ? "bg-purple-700 text-white shadow-lg"
                      : "bg-white text-purple-700 hover:bg-purple-50"
                  }`}
                  title="Shared Recipes"
                >
                  <FaUtensils size={18} />
                </button>
                <button
                  onClick={() => setViewMode("lists")}
                  className={`p-3 rounded-full transition-all ${
                    viewMode === "lists"
                      ? "bg-purple-700 text-white shadow-lg"
                      : "bg-white text-purple-700 hover:bg-purple-50"
                  }`}
                  title="Shared Shopping Lists"
                >
                  <FaShoppingCart size={18} />
                </button>
                {showListSuccess && (
                  <div className="ml-3 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                    ✓ Lists added successfully!
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Family Member Profile Pictures */}
          {groupInfo && groupInfo.members && groupInfo.members.length > 0 && (
            <div className="flex -space-x-2">
              {groupInfo.members.map((member: { id: string; username?: string; email: string; profileImage?: string }) => (
                <div
                  key={member.id}
                  className="relative group"
                  title={member.username || member.email}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center text-white font-bold transition-transform group-hover:scale-125 group-hover:z-10 cursor-pointer shadow">
                    {member.profileImage ? (
                      <img src={member.profileImage} alt={member.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{member.username?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {member.username || member.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipes View */}
        {viewMode === "recipes" && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-purple-900">
                Shared Recipes ({familyRecipes.length})
              </h2>
              <div className="flex gap-2 items-center">
                {showSuccess && (
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium animate-fade-in">
                    ✓ Recipes added successfully!
                  </div>
                )}
                {familyEnabled && (
                  <>
                    {deleteMode === "recipes" && (
                      <button
                        className={`px-4 py-2 rounded-lg font-semibold transition text-sm flex items-center gap-2 ${
                          selectedForDeletion.length > 0
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        onClick={() => {
                          if (selectedForDeletion.length > 0) {
                            setShowDeleteConfirm(true);
                          } else {
                            setDeleteMode(null);
                          }
                        }}
                      >
                        {selectedForDeletion.length > 0 ? (
                          <>Delete {selectedForDeletion.length} Selected</>
                        ) : (
                          <>Cancel</>
                        )}
                      </button>
                    )}
                    {!deleteMode && (
                      <button
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition text-sm flex items-center gap-2"
                        onClick={() => {
                          setDeleteMode("recipes");
                          setSelectedForDeletion([]);
                        }}
                        title="Delete recipes"
                      >
                        <FaTimes /> Delete Mode
                      </button>
                    )}
                    <button
                      className="bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-800 transition text-sm flex items-center gap-2"
                      onClick={() => {
                        setShowAddModal(true);
                        setAddModalStep("choice");
                      }}
                    >
                      <FaPlus /> Add Recipe
                    </button>
                  </>
                )}
              </div>
            </div>

            {familyRecipes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-500 text-sm mb-4">
                  No family recipes yet! Add recipes to share them with all family members.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {familyRecipes.map((recipe: { _id?: string; id?: string; icon?: number; color?: string; name: string; description?: string; mealType?: string; tags?: string[]; ingredients?: unknown[] }, idx: number) => {
                  const Icon = RECIPE_ICONS?.[recipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
                  const recipeId = recipe._id || recipe.id || '';
                  const isSelectedForDeletion = selectedForDeletion.includes(recipeId);
                  return (
                    <div
                      key={recipe._id || recipe.id || idx}
                      className={`bg-white rounded-lg shadow p-4 flex flex-col justify-between cursor-pointer relative min-h-[220px] max-h-[220px] transition-all ${
                        deleteMode === "recipes" 
                          ? isSelectedForDeletion 
                            ? "ring-4 ring-red-500 bg-red-50" 
                            : "hover:ring-2 hover:ring-gray-300"
                          : "hover:scale-105"
                      }`}
                      style={{
                        cursor: "pointer",
                        borderLeft: recipe.color ? `8px solid ${recipe.color}` : undefined,
                      }}
                      onClick={() => {
                        if (deleteMode === "recipes") {
                          // Toggle selection in delete mode
                          if (isSelectedForDeletion) {
                            setSelectedForDeletion(prev => prev.filter(id => id !== recipeId));
                          } else {
                            setSelectedForDeletion(prev => [...prev, recipeId]);
                          }
                        } else {
                          // Show detail modal
                          setSelectedRecipe(recipe);
                          setShowRecipeDetail(true);
                        }
                      }}
                    >
                      {/* Delete mode X icon */}
                      {deleteMode === "recipes" && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelectedForDeletion ? "bg-red-600" : "bg-red-100"
                          }`}>
                            <FaTimes className={isSelectedForDeletion ? "text-white" : "text-red-600"} size={16} />
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md text-2xl"
                            style={{ background: recipe.color || "#f3f4f6" }}
                          >
                            <Icon />
                          </div>
                          {/* Action buttons (not in delete mode) */}
                          {!deleteMode && (
                            <div className="flex gap-1">
                              {/* Edit button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecipe(recipe);
                                  setShowRecipeModal(true);
                                }}
                                className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
                                title="Edit recipe"
                              >
                                <FaPencilAlt size={14} />
                              </button>
                              {/* Shopping cart button */}
                              {familyShoppingLists.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRecipeToAdd(recipe);
                                    setSelectedTargetListId(familyShoppingLists[0]._id || "");
                                    setShowRecipeToListModal(true);
                                  }}
                                  className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 transition"
                                  title="Add ingredients to shopping list"
                                >
                                  <FaShoppingCart size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-black leading-tight mb-1">
                          {recipe.name}
                        </h3>
                        {recipe.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {recipe.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {recipe.mealType && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {recipe.mealType}
                          </span>
                        )}
                        {recipe.tags && recipe.tags.length > 0 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {Array.isArray(recipe.tags) ? recipe.tags[0] : recipe.tags}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Shopping Lists View */}
        {viewMode === "lists" && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-purple-900">
                Shared Shopping Lists ({familyShoppingLists.length})
              </h2>
              <div className="flex gap-2 items-center">
                {familyEnabled && (
                  <>
                    {deleteMode === "lists" && (
                      <button
                        className={`px-4 py-2 rounded-lg font-semibold transition text-sm flex items-center gap-2 ${
                          selectedForDeletion.length > 0
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        onClick={() => {
                          if (selectedForDeletion.length > 0) {
                            setShowDeleteConfirm(true);
                          } else {
                            setDeleteMode(null);
                          }
                        }}
                      >
                        {selectedForDeletion.length > 0 ? (
                          <>Delete {selectedForDeletion.length} Selected</>
                        ) : (
                          <>Cancel</>
                        )}
                      </button>
                    )}
                    {!deleteMode && (
                      <button
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition text-sm flex items-center gap-2"
                        onClick={() => {
                          setDeleteMode("lists");
                          setSelectedForDeletion([]);
                        }}
                        title="Delete lists"
                      >
                        <FaTimes /> Delete Mode
                      </button>
                    )}
                    <button
                      className="bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-800 transition text-sm flex items-center gap-2"
                      onClick={() => {
                        setShowListAddModal(true);
                        setListAddStep("choice");
                      }}
                    >
                      <FaPlus /> Add List
                    </button>
                  </>
                )}
              </div>
            </div>

            {familyShoppingLists.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-500 text-sm mb-4">
                  No shared shopping lists yet! Add lists to share them with all family members.
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden flex" style={{ minHeight: "500px" }}>
                {/* Left: List of lists */}
                <div className="w-1/3 border-r overflow-y-auto">
                  <div className="p-4 bg-gray-50 border-b font-semibold text-sm">
                    All Lists ({familyShoppingLists.length})
                  </div>
                  <div className="divide-y">
                    {familyShoppingLists.map((list: { _id?: string; name: string; items?: { _id?: string; name: string; quantity?: string; checked?: boolean }[] }) => {
                      const listId = list._id || '';
                      const isSelectedForDeletion = selectedForDeletion.includes(listId);
                      return (
                        <button
                          key={list._id}
                          onClick={() => {
                            if (deleteMode === "lists") {
                              // Toggle selection in delete mode
                              if (isSelectedForDeletion) {
                                setSelectedForDeletion(prev => prev.filter(id => id !== listId));
                              } else {
                                setSelectedForDeletion(prev => [...prev, listId]);
                              }
                            } else {
                              setSelectedShoppingList(list);
                            }
                          }}
                          className={`w-full p-4 text-left transition relative ${
                            deleteMode === "lists"
                              ? isSelectedForDeletion
                                ? "bg-red-50 border-l-4 border-red-600"
                                : "hover:bg-gray-50"
                              : selectedShoppingList?._id === list._id 
                                ? "bg-purple-50 border-l-4 border-purple-700" 
                                : "hover:bg-gray-50"
                          }`}
                        >
                          {/* Delete mode X icon */}
                          {deleteMode === "lists" && (
                            <div className="absolute top-2 right-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isSelectedForDeletion ? "bg-red-600" : "bg-red-100"
                              }`}>
                                <FaTimes className={isSelectedForDeletion ? "text-white" : "text-red-600"} size={12} />
                              </div>
                            </div>
                          )}
                          <div className="font-medium text-black">{list.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {list.items?.length || 0} items
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Selected list details */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {selectedShoppingList ? (
                    <>
                      <h3 className="text-xl font-bold mb-4 text-black">
                        {selectedShoppingList.name}
                      </h3>
                      {(!selectedShoppingList.items || selectedShoppingList.items.length === 0) ? (
                        <div className="text-gray-500 text-sm">No items in this list</div>
                      ) : (
                        <div className="space-y-2">
                          {selectedShoppingList.items.map((item: { _id?: string; name: string; quantity?: string; checked?: boolean }, idx: number) => (
                            <div
                              key={item._id || idx}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <input
                                type="checkbox"
                                checked={item.checked || false}
                                onChange={() => handleCheckSharedItem(
                                  selectedShoppingList._id || '',
                                  item._id || '',
                                  item.checked || false
                                )}
                                className="w-5 h-5 rounded accent-purple-700 cursor-pointer"
                              />
                              <div className={`flex-1 ${item.checked ? "line-through text-gray-400" : "text-black"}`}>
                                <div className="font-medium">{item.name}</div>
                                {item.quantity && (
                                  <div className="text-xs text-gray-500">{item.quantity}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 text-center py-12">
                      Select a list to view details
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="bg-purple-50 rounded-lg p-4 text-purple-900 text-sm mt-6">
          <div className="font-semibold mb-1">What is the Family Cook Book?</div>
          <div>
            The Family Cook Book is a shared space for your family group to collect and manage recipes together. Only family members can view and edit these recipes.
          </div>
        </div>
      </div>

      {/* Add Recipe Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowAddModal(false);
                setAddModalStep("choice");
                setSelectedRecipes([]);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition z-10"
              aria-label="Close"
            >
              <FaTimes className="text-gray-600" />
            </button>

            {/* Choice Step */}
            {addModalStep === "choice" && (
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-center">Add Recipe to Family Cook Book</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setAddModalStep("create")}
                    className="p-6 border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                      <FaPlus className="text-3xl text-purple-700" />
                    </div>
                    <div className="text-lg font-semibold">Create New Recipe</div>
                    <div className="text-sm text-gray-600 text-center">Start from scratch and create a new recipe for your family</div>
                  </button>
                  <button
                    onClick={() => setAddModalStep("select")}
                    className="p-6 border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                      <span className="text-3xl">📚</span>
                    </div>
                    <div className="text-lg font-semibold">Add from My Recipes</div>
                    <div className="text-sm text-gray-600 text-center">Share existing recipes from your personal collection</div>
                  </button>
                </div>
              </div>
            )}

            {/* Create New Recipe Step */}
            {addModalStep === "create" && (
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-2rem)]">
                <button
                  onClick={() => setAddModalStep("choice")}
                  className="mb-4 text-purple-700 hover:text-purple-900 text-sm font-medium"
                >
                  ← Back to options
                </button>
                <h2 className="text-2xl font-bold mb-6">Create New Recipe</h2>
                {/* Recipe creation form will go here - placeholder for now */}
                <div className="text-gray-600 text-center py-12">
                  Recipe creation form coming soon...
                </div>
              </div>
            )}

            {/* Select from My Recipes Step */}
            {addModalStep === "select" && (
              <div className="flex flex-col h-[80vh]">
                <div className="p-6 border-b">
                  <button
                    onClick={() => setAddModalStep("choice")}
                    className="mb-4 text-purple-700 hover:text-purple-900 text-sm font-medium"
                  >
                    ← Back to options
                  </button>
                  <h2 className="text-2xl font-bold">Add from My Recipes</h2>
                  <p className="text-sm text-gray-600 mt-1">Select recipes to share with your family</p>
                </div>
                
                <div className="flex-1 grid grid-cols-2 overflow-hidden">
                  {/* Left side: Recipe list */}
                  <div className="border-r overflow-y-auto p-4">
                    <h3 className="font-semibold mb-3 sticky top-0 bg-white pb-2">My Recipes ({userRecipes.length})</h3>
                    {userRecipes.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-8">
                        No recipes yet. Create some recipes first!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userRecipes.map((recipe: { id?: string; _id?: string; name: string; icon?: number; description?: string; ingredients?: unknown[]; instructions?: unknown[] }) => {
                          const recipeId = recipe.id || recipe._id || '';
                          const isSelected = selectedRecipes.includes(recipeId);
                          return (
                            <div
                              key={recipeId}
                              onClick={() => {
                                if (!recipeId) return;
                                if (isSelected) {
                                  setSelectedRecipes(prev => prev.filter(id => id !== recipeId));
                                } else {
                                  setSelectedRecipes(prev => [...prev, recipeId]);
                                }
                              }}
                              className={`p-3 border rounded-lg cursor-pointer transition ${
                                isSelected
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-medium text-sm">{recipe.name}</div>
                              {recipe.description && (
                                <div className="text-xs text-gray-600 mt-1 line-clamp-1">{recipe.description}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right side: Drop zone */}
                  <div className="overflow-y-auto p-4 bg-gray-50">
                    <h3 className="font-semibold mb-3 sticky top-0 bg-gray-50 pb-2">
                      Selected ({selectedRecipes.length})
                    </h3>
                    {selectedRecipes.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
                        <div className="mb-2">📝</div>
                        <div>Click recipes on the left to add them here</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedRecipes.map(recipeId => {
                          const recipe = userRecipes.find((r: { id?: string; _id?: string; name: string; description?: string; ingredients?: unknown[]; instructions?: unknown[] }) => (r.id || r._id) === recipeId);
                          if (!recipe) return null;
                          return (
                            <div
                              key={recipeId}
                              className="p-3 bg-white border border-purple-200 rounded-lg flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{recipe.name}</div>
                              </div>
                              <button
                                onClick={() => setSelectedRecipes(prev => prev.filter(id => id !== recipeId))}
                                className="ml-2 p-1 rounded hover:bg-red-50 text-red-600"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom action buttons */}
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setAddModalStep("choice");
                      setSelectedRecipes([]);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRecipes}
                    disabled={selectedRecipes.length === 0 || addingRecipes}
                    className="px-6 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingRecipes ? "Adding..." : "Add to Family Cook Book"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {showRecipeModal && selectedRecipe && (
        <RecipeModal
          open={showRecipeModal}
          initialData={{
            name: selectedRecipe.name || "",
            iconIdx: selectedRecipe.icon || 0,
            description: selectedRecipe.description || "",
            ingredients: (selectedRecipe.ingredients as { name: string; quantity: string; unit: string }[]) || [],
            instructions: (selectedRecipe.instructions as string[]) || [],
            mealType: selectedRecipe.mealType || "",
            tags: Array.isArray(selectedRecipe.tags) ? selectedRecipe.tags.join(", ") : "",
            color: selectedRecipe.color || "#fff",
            id: selectedRecipe._id || selectedRecipe.id || "",
          }}
          onClose={() => {
            setShowRecipeModal(false);
            setSelectedRecipe(null);
          }}
        />
      )}

      {/* Add Shopping List Modal */}
      {showListAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
            <button
              onClick={() => {
                setShowListAddModal(false);
                setListAddStep("choice");
                setSelectedUserLists([]);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition z-10"
              aria-label="Close"
            >
              <FaTimes className="text-gray-600" />
            </button>

            {/* Choice Step */}
            {listAddStep === "choice" && (
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-center">Add Shopping List to Family Share</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setListAddStep("create")}
                    className="p-6 border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                      <FaPlus className="text-3xl text-purple-700" />
                    </div>
                    <div className="text-lg font-semibold">Create New List</div>
                    <div className="text-sm text-gray-600 text-center">Start a new shopping list from scratch</div>
                  </button>
                  <button
                    onClick={() => setListAddStep("select")}
                    className="p-6 border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                      <FaShoppingCart className="text-3xl text-purple-700" />
                    </div>
                    <div className="text-lg font-semibold">Copy from My Lists</div>
                    <div className="text-sm text-gray-600 text-center">Share existing lists from your collection</div>
                  </button>
                </div>
              </div>
            )}

            {/* Create New List Step */}
            {listAddStep === "create" && (
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-2rem)]">
                <button
                  onClick={() => {
                    setListAddStep("choice");
                    setShowCreateListModal(false);
                  }}
                  className="mb-4 text-purple-700 hover:text-purple-900 text-sm font-medium"
                >
                  ← Back to options
                </button>
                <h2 className="text-2xl font-bold mb-6">Create New Shopping List</h2>
                <p className="text-gray-600 mb-4">Create a new shopping list and share it with your family.</p>
                <button
                  onClick={() => setShowCreateListModal(true)}
                  className="w-full p-6 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <FaPlus className="text-3xl text-purple-700" />
                  </div>
                  <div className="text-lg font-semibold">Create Shopping List</div>
                  <div className="text-sm text-gray-600">Click to open the list creation form</div>
                </button>
              </div>
            )}

            {/* Select from My Lists Step */}
            {listAddStep === "select" && (
              <div className="flex flex-col h-[80vh]">
                <div className="p-6 border-b">
                  <button
                    onClick={() => setListAddStep("choice")}
                    className="mb-4 text-purple-700 hover:text-purple-900 text-sm font-medium"
                  >
                    ← Back to options
                  </button>
                  <h2 className="text-2xl font-bold">Copy from My Lists</h2>
                  <p className="text-sm text-gray-600 mt-1">Select lists to share with your family</p>
                </div>
                
                <div className="flex-1 grid grid-cols-2 overflow-hidden">
                  {/* Left: User's lists */}
                  <div className="border-r overflow-y-auto p-4">
                    <h3 className="font-semibold mb-3 sticky top-0 bg-white pb-2">My Lists ({userShoppingLists.length})</h3>
                    {userShoppingLists.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-8">
                        No lists yet. Create some lists first!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userShoppingLists.map((list) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const listId = typeof list._id === 'string' ? list._id : (list._id as any)?.toString?.();
                          if (!listId) return null;
                          const isSelected = selectedUserLists.includes(listId);
                          return (
                            <div
                              key={listId}
                              onClick={() => {
                                if (!listId) return;
                                if (isSelected) {
                                  setSelectedUserLists(prev => prev.filter(id => id !== listId));
                                } else {
                                  setSelectedUserLists(prev => [...prev, listId]);
                                }
                              }}
                              className={`p-3 border rounded-lg cursor-pointer transition ${
                                isSelected
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-medium text-sm">{list.name}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {list.items?.length || 0} items
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Selected lists */}
                  <div className="overflow-y-auto p-4 bg-gray-50">
                    <h3 className="font-semibold mb-3 sticky top-0 bg-gray-50 pb-2">
                      Selected ({selectedUserLists.length})
                    </h3>
                    {selectedUserLists.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 text-sm">
                        <div className="mb-2">🛒</div>
                        <div>Click lists on the left to add them here</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedUserLists.map(listId => {
                          const list = userShoppingLists.find((l) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const lId = typeof l._id === 'string' ? l._id : (l._id as any)?.toString?.();
                            return lId === listId;
                          });
                          if (!list) return null;
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const currentListId = typeof list._id === 'string' ? list._id : (list._id as any)?.toString?.();
                          if (!currentListId) return null;
                          return (
                            <div
                              key={listId}
                              className="p-3 bg-white border border-purple-200 rounded-lg flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{list.name}</div>
                                <div className="text-xs text-gray-600">{list.items?.length || 0} items</div>
                              </div>
                              <button
                                onClick={() => setSelectedUserLists(prev => prev.filter(id => id !== currentListId))}
                                className="ml-2 p-1 rounded hover:bg-red-50 text-red-600"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom buttons */}
                <div className="p-4 border-t bg-white flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowListAddModal(false);
                      setListAddStep("choice");
                      setSelectedUserLists([]);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLists}
                    disabled={selectedUserLists.length === 0 || addingLists}
                    className="px-6 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingLists ? "Adding..." : `Add ${selectedUserLists.length} List${selectedUserLists.length !== 1 ? 's' : ''} to Family`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ShoppingListModal for creating new lists */}
      <ShoppingListModal
        open={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        onSave={handleCreateNewList}
        isEdit={false}
      />

      {/* Recipe to Shopping List Modal */}
      {showRecipeToListModal && recipeToAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowRecipeToListModal(false);
                setRecipeToAdd(null);
                setSelectedTargetListId("");
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <FaTimes className="text-gray-600" />
            </button>

            <h2 className="text-xl font-bold mb-4">Add to Shopping List</h2>
            <p className="text-sm text-gray-600 mb-4">
              Send ingredients from <span className="font-semibold">{recipeToAdd.name}</span> to a shared shopping list
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Shopping List</label>
              <select
                value={selectedTargetListId}
                onChange={(e) => setSelectedTargetListId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {familyShoppingLists.map((list) => (
                  <option key={list._id} value={list._id}>
                    {list.name} ({list.items?.length || 0} items)
                  </option>
                ))}
              </select>
            </div>

            {showAddToListSuccess && (
              <div className="mb-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                ✓ Ingredients added successfully!
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRecipeToListModal(false);
                  setRecipeToAdd(null);
                  setSelectedTargetListId("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRecipeToShoppingList}
                disabled={!selectedTargetListId || sendingToList}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingToList ? "Sending..." : (
                  <>
                    <FaShoppingCart />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal (Read-only) */}
      {showRecipeDetail && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
            <button
              onClick={() => {
                setShowRecipeDetail(false);
                setSelectedRecipe(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition z-10"
              aria-label="Close"
            >
              <FaTimes className="text-gray-600" />
            </button>

            <div className="p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: selectedRecipe.color || "#f3f4f6" }}
                >
                  {(() => {
                    const Icon = RECIPE_ICONS?.[selectedRecipe.icon as number]?.icon || RECIPE_ICONS[0].icon;
                    return <Icon />;
                  })()}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-black">{selectedRecipe.name}</h2>
                  {selectedRecipe.mealType && (
                    <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {selectedRecipe.mealType}
                    </span>
                  )}
                </div>
              </div>

              {selectedRecipe.description && (
                <div className="mb-6">
                  <p className="text-gray-700">{selectedRecipe.description}</p>
                </div>
              )}

              {selectedRecipe.ingredients && (selectedRecipe.ingredients as unknown[]).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3 text-black">Ingredients</h3>
                  <div className="space-y-2">
                    {(selectedRecipe.ingredients as { name: string; quantity?: string; unit?: string }[]).map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-purple-700 font-bold">•</span>
                        <span className="flex-1 text-black">
                          {ing.quantity && ing.unit ? `${ing.quantity} ${ing.unit} ` : ing.quantity ? `${ing.quantity} ` : ''}
                          {ing.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecipe.instructions && (selectedRecipe.instructions as unknown[]).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3 text-black">Instructions</h3>
                  <div className="space-y-3">
                    {(selectedRecipe.instructions as string[]).map((instruction, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <p className="flex-1 text-gray-700 mt-1">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecipe.tags && (selectedRecipe.tags as string[]).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-700">Tags:</span>
                  {(selectedRecipe.tags as string[]).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <h2 className="text-xl font-bold text-black">Confirm Delete</h2>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete {selectedForDeletion.length} {deleteMode === "recipes" ? "recipe" : "list"}
              {selectedForDeletion.length !== 1 ? "s" : ""} from the family share? This action cannot be undone.
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
                    Delete
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
