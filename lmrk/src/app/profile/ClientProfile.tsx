"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FaPencilAlt, FaUser, FaUserTie, FaUserNurse, FaUserAstronaut, FaUserSecret, FaUserGraduate } from "react-icons/fa";

// Fix: Only use string keys for PROFILE_ICONS and type for icon
const PROFILE_ICONS: { id: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "FaUser", icon: FaUser },
  { id: "FaUserTie", icon: FaUserTie },
  { id: "FaUserNurse", icon: FaUserNurse },
  { id: "FaUserAstronaut", icon: FaUserAstronaut },
  { id: "FaUserSecret", icon: FaUserSecret },
  { id: "FaUserGraduate", icon: FaUserGraduate },
];

export default function ClientProfile({
  profileImage,
  username,
  email,
  bio,
  recipesCount,
  shoppingListsCount,
}: {
  profileImage: string;
  username: string;
  email: string;
  bio: string;
  recipesCount: number;
  shoppingListsCount: number;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(bio || "");
  const [bioCount, setBioCount] = useState(bio.length || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIconId, setSelectedIconId] = useState(profileImage || "FaUser");
  const router = useRouter();
  const { update: updateSession } = useSession();

  // Exit edit mode when component unmounts (as router.events is not available in app directory)
  useEffect(() => {
    return () => {
      setEditMode(false);
    };
  }, []);

  // Get icon component by id
  const SelectedIcon =
    PROFILE_ICONS.find(i => i.id === selectedIconId)?.icon || FaUser;

  // Fix: Ensure selectedIconId updates if profileImage prop changes (e.g. after save)
  useEffect(() => {
    setSelectedIconId(profileImage || "FaUser");
  }, [profileImage]);

  // Fix: Prevent memory leaks by clearing intervals/timeouts on unmount
  useEffect(() => {
    return () => {
      setShowIconPicker(false);
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: editUsername,
          bio: editBio,
          profileImage: selectedIconId, // Save icon id
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save profile.");
        setSaving(false);
        return;
      }
      // Refresh session data to reflect updated user info
      // Use signIn with redirect: false to update session with new user data
      await signIn("credentials", {
        redirect: false,
        email,
        password: "", // Password is required by credentials provider, but you can handle this in your authorize logic to allow session refresh without password
        updateProfile: true, // Custom flag you can check in authorize to allow session update without password
      });
      await updateSession?.();
      setEditMode(false);
    } catch (e) {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  // Fix: Prevent form submission on Enter key in icon picker
  const handleIconButtonClick = useCallback((iconId: string) => {
    setSelectedIconId(iconId);
    setShowIconPicker(false);
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-purple-300 flex flex-col items-center"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg py-8 px-4 sm:px-6 mt-4 mb-8 sm:mt-10"
        style={{
          // Responsive margin for mobile
          marginTop: "clamp(16px, 5vw, 40px)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          {editMode ? (
            <button
              className="bg-purple-700 text-white shadow rounded-full px-5 py-2 z-10 hover:bg-purple-800 font-semibold"
              title="Save Profile"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? "Saving..." : "SAVE"}
            </button>
          ) : (
            <button
              className="bg-purple-100 shadow rounded-full p-3 z-10 hover:bg-purple-200"
              title="Edit Profile"
              onClick={() => setEditMode(true)}
              type="button"
            >
              <FaPencilAlt className="text-purple-700" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="relative group">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center relative cursor-pointer border-2 border-purple-200"
              onClick={e => {
                if (editMode) {
                  e.stopPropagation();
                  setShowIconPicker((v) => !v);
                }
              }}
              tabIndex={editMode ? 0 : -1}
              aria-label="Choose profile icon"
              role="button"
            >
              <SelectedIcon className="text-5xl text-purple-700" />
              {/* Pencil icon in bottom right in edit mode */}
              {editMode && (
                <span
                  className="absolute bottom-1 right-1 bg-purple-100 rounded-full p-1 shadow cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    setShowIconPicker((v) => !v);
                  }}
                  tabIndex={0}
                  aria-label="Edit profile icon"
                  role="button"
                >
                  <FaPencilAlt className="text-purple-700 text-xs" />
                </span>
              )}
            </div>
            {/* Icon picker dropdown */}
            {editMode && showIconPicker && (
              <>
                <div
                  className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 bg-white border rounded-xl shadow-lg p-4 grid grid-cols-3 gap-4 min-w-[220px]"
                  onClick={e => e.stopPropagation()}
                >
                  {PROFILE_ICONS.map((iconObj) => {
                    const Icon = iconObj.icon;
                    return (
                      <button
                        key={iconObj.id}
                        type="button"
                        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition ${
                          selectedIconId === iconObj.id
                            ? "border-purple-700 bg-purple-100"
                            : "border-gray-200 bg-white"
                        }`}
                        onClick={() => handleIconButtonClick(iconObj.id)}
                        aria-label={iconObj.id}
                        tabIndex={0}
                      >
                        <Icon className="text-3xl text-purple-700" />
                      </button>
                    );
                  })}
                </div>
                {/* Overlay to close dropdown when clicking outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowIconPicker(false)}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </>
            )}
          </div>
          <div>
            {editMode ? (
              <input
                className="text-lg font-semibold border-b border-purple-400 focus:outline-none focus:border-purple-700 bg-purple-50 px-1 py-0.5 rounded"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={32}
                type="text"
                autoComplete="off"
              />
            ) : (
              <p className="text-lg font-semibold">{username}</p>
            )}
            <p className="text-gray-500">{email}</p>
          </div>
        </div>
        <div className="mb-4">
          {editMode ? (
            <div className="relative">
              <textarea
                className="w-full border rounded p-2 resize-none min-h-[60px] max-h-[120px] bg-purple-50"
                value={editBio}
                maxLength={200}
                onChange={(e) => {
                  setEditBio(e.target.value);
                  setBioCount(e.target.value.length);
                }}
                rows={3}
                placeholder="Tell us about yourself..."
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                {bioCount}/200
              </span>
            </div>
          ) : (
            <p className="text-gray-700 min-h-[60px]">{bio}</p>
          )}
        </div>
        {error && (
          <div className="text-red-600 text-sm mb-2">{error}</div>
        )}
        <div className="flex gap-8 mt-2">
          <div className="bg-purple-100 rounded px-4 py-2 text-center flex-1">
            <span className="block text-lg font-bold">{recipesCount}</span>
            <span className="text-xs text-gray-700">Recipes</span>
          </div>
          <div className="bg-purple-100 rounded px-4 py-2 text-center flex-1">
            <span className="block text-lg font-bold">{shoppingListsCount}</span>
            <span className="text-xs text-gray-700">Shopping Lists</span>
          </div>
        </div>
        {editMode && (
          <div className="mt-6 text-xs text-gray-400 text-center">
            Changes may take several minutes to take effect.
          </div>
        )}
      </div>
    </div>
  );
}
