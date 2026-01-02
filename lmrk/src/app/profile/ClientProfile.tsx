"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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
  const { update: updateSession } = useSession();

  // Get icon component by id
  const SelectedIcon = PROFILE_ICONS.find(i => i.id === selectedIconId)?.icon || FaUser;

  // Sync selectedIconId with profileImage prop
  useEffect(() => {
    setSelectedIconId(profileImage || "FaUser");
  }, [profileImage]);

  // Sync editUsername, editBio, and bioCount with props
  useEffect(() => {
    setEditUsername(username);
  }, [username]);
  useEffect(() => {
    setEditBio(bio || "");
    setBioCount(bio.length || 0);
  }, [bio]);

  // Save handler
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
          profileImage: selectedIconId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save profile.");
        setSaving(false);
        return;
      }
      await updateSession?.();
      setEditMode(false);
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  // Icon picker handler
  const handleIconButtonClick = useCallback((iconId: string) => {
    setSelectedIconId(iconId);
    setShowIconPicker(false);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{ background: "var(--theme-pageBg)" }}
    >
      <div
        className="w-full max-w-2xl rounded-xl shadow-lg py-8 px-4 sm:px-6 mt-4 mb-8 sm:mt-10"
        style={{
          background: "var(--theme-floatingMenuBg)",
          marginTop: "clamp(16px, 5vw, 40px)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--theme-main)" }}>Profile</h1>
          {editMode ? (
            <button
              className="shadow rounded-full px-5 py-2 z-10 font-semibold"
              style={{ background: "var(--theme-main)", color: "#fff" }}
              title="Save Profile"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? "Saving..." : "SAVE"}
            </button>
          ) : (
            <button
              className="shadow rounded-full p-3 z-10"
              style={{ background: "var(--theme-menuBarBg)" }}
              title="Edit Profile"
              onClick={() => setEditMode(true)}
              type="button"
            >
              <FaPencilAlt style={{ color: "var(--theme-menuBarText)" }} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="relative group">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center relative cursor-pointer border-2"
              style={{ background: "var(--theme-menuBarBg)", borderColor: "var(--theme-main)" }}
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
              <SelectedIcon className="text-5xl" style={{ color: "var(--theme-menuBarText)" }} />
              {/* Pencil icon in bottom right in edit mode */}
              {editMode && (
                <span
                  className="absolute bottom-1 right-1 rounded-full p-1 shadow cursor-pointer"
                  style={{ background: "var(--theme-floatingMenuBg)" }}
                  onClick={e => {
                    e.stopPropagation();
                    setShowIconPicker((v) => !v);
                  }}
                  tabIndex={0}
                  aria-label="Edit profile icon"
                  role="button"
                >
                  <FaPencilAlt style={{ color: "var(--theme-main)", fontSize: "0.85em" }} />
                </span>
              )}
            </div>
            {/* Icon picker dropdown */}
            {editMode && showIconPicker && (
              <>
                <div
                  className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 border rounded-xl shadow-lg p-4 grid grid-cols-3 gap-4 min-w-[220px]"
                  style={{ background: "var(--theme-floatingMenuBg)", borderColor: "var(--theme-main)" }}
                  onClick={e => e.stopPropagation()}
                >
                  {PROFILE_ICONS.map((iconObj) => {
                    const Icon = iconObj.icon;
                    const isSelected = selectedIconId === iconObj.id;
                    const btnClass =
                      "w-14 h-14 rounded-full flex items-center justify-center border-2 transition" +
                      (isSelected ? " bg-opacity-80" : "");
                    const btnStyle = {
                      borderColor: isSelected ? "var(--theme-main)" : "var(--theme-menuBarBg)",
                      background: isSelected ? "var(--theme-main)" : "var(--theme-floatingMenuBg)",
                    };
                    return (
                      <button
                        key={iconObj.id}
                        type="button"
                        className={btnClass}
                        style={btnStyle}
                        onClick={() => handleIconButtonClick(iconObj.id)}
                        aria-label={iconObj.id}
                        tabIndex={0}
                      >
                        <Icon className="text-3xl text-white" />
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
                ></div>
              </>
            )}
          </div>
          <div>
            {editMode ? (
              <input
                className="text-lg font-semibold border-b focus:outline-none bg-transparent px-1 py-0.5 rounded"
                style={{ borderColor: "var(--theme-main)", color: "var(--theme-main)" }}
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={32}
                type="text"
                autoComplete="off"
              />
            ) : (
              <p className="text-lg font-semibold" style={{ color: "var(--theme-main)" }}>{username}</p>
            )}
            <p style={{ color: "var(--theme-menuBarText)", opacity: 0.7 }}>{email}</p>
          </div>
        </div>
        <div className="mb-4">
          {editMode ? (
            <div className="relative">
              <textarea
                className="w-full border rounded p-2 resize-none min-h-[60px] max-h-[120px] bg-transparent"
                style={{ borderColor: "var(--theme-main)", color: "var(--theme-pageSubText)" }}
                value={editBio}
                maxLength={200}
                onChange={(e) => {
                  setEditBio(e.target.value);
                  setBioCount(e.target.value.length);
                }}
                rows={3}
                placeholder="Tell us about yourself..."
              />
              <span className="absolute bottom-2 right-3 text-xs" style={{ color: "var(--theme-pageSubText)", opacity: 0.5 }}>
                {bioCount}/200
              </span>
            </div>
          ) : (
            <p className="min-h-[60px]" style={{ color: "var(--theme-pageSubText)" }}>{bio}</p>
          )}
        </div>
        {error && (
          <div className="text-sm mb-2" style={{ color: "var(--theme-main)" }}>{error}</div>
        )}
        <div className="flex gap-8 mt-2">
          <div className="rounded px-4 py-2 text-center flex-1" style={{ background: "var(--theme-main)", color: "#fff" }}>
            <span className="block text-lg font-bold">{recipesCount}</span>
            <span className="text-xs" style={{ color: "#fff", opacity: 0.85 }}>Recipes</span>
          </div>
          <div className="rounded px-4 py-2 text-center flex-1" style={{ background: "var(--theme-main)", color: "#fff" }}>
            <span className="block text-lg font-bold">{shoppingListsCount}</span>
            <span className="text-xs" style={{ color: "#fff", opacity: 0.85 }}>Shopping Lists</span>
          </div>
        </div>
        {editMode && (
          <div className="mt-6 text-xs text-center" style={{ color: "var(--theme-pageSubText)", opacity: 0.5 }}>
            Changes may take several minutes to take effect.
          </div>
        )}
      </div>
    </div>
  );
}

