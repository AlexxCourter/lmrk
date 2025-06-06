"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaUser, FaUserTie, FaUserNurse, FaUserAstronaut, FaUserSecret, FaUserGraduate } from "react-icons/fa";
import { FaListUl } from "react-icons/fa"; // Use as the LMRK logo icon

// Fix: Only use string keys for PROFILE_ICONS
const PROFILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FaUser,
  FaUserTie,
  FaUserNurse,
  FaUserAstronaut,
  FaUserSecret,
  FaUserGraduate,
};

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<"profile" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu]);

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 border-b-0 bg-purple-700 relative">
      <div className="flex items-center gap-2">
        <FaListUl className="text-white text-2xl cursor-pointer" onClick={() => router.push("/")} />
        <span
          className="font-bold text-lg text-white cursor-pointer"
          style={{ fontFamily: "'Bree Serif', serif" }}
          onClick={() => router.push("/")}
        >
          LMRK
        </span>
      </div>
      <div className="flex items-center gap-2" ref={menuRef}>
        {/* Dashboard link before profile */}
        <button
          className="text-white font-semibold hover:underline mr-2 cursor-pointer"
          style={{ fontFamily: "'Bree Serif', serif" }}
          onClick={() => router.push("/tools")}
        >
          Dashboard
        </button>
        {session?.user ? (
          <div className="relative">
            <button
              className="ml-2 rounded-full border-2 border-white w-10 h-10 overflow-hidden bg-white flex items-center justify-center cursor-pointer"
              title={session.user.name ?? "Profile"}
              onClick={() =>
                setOpenMenu(openMenu === "profile" ? null : "profile")
              }
            >
              {/* Use icon id if present, fallback to gray circle */}
              {/* Use 'image' property as the icon key, or fallback to gray circle */}
              {session.user.image && PROFILE_ICONS[session.user.image] ? (
                (() => {
                  const Icon = PROFILE_ICONS[session.user.image as string];
                  return <Icon className="text-2xl text-purple-700" />;
                })()
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-gray-300 rounded-full">
                  <svg width="32" height="32">
                    <circle cx="16" cy="16" r="16" fill="#d1d5db" />
                  </svg>
                </span>
              )}
            </button>
            {openMenu === "profile" && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg z-50 py-2">
                {/* Account Section */}
                <div>
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Account
                  </div>
                  <button
                    className="block w-full text-left px-4 py-2 text-purple-700 hover:bg-purple-100 font-medium cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null);
                      router.push("/profile");
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-purple-700 hover:bg-purple-100 font-medium cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null);
                      router.push("/user-settings");
                    }}
                  >
                    Settings
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null);
                      signOut();
                    }}
                  >
                    Log out
                  </button>
                </div>
                {/* Divider */}
                <div className="my-2 border-t border-gray-200" />
                {/* Resources Section */}
                <div>
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Resources
                  </div>
                  <button
                    className="block w-full text-left px-4 py-2 text-purple-700 hover:bg-purple-100 font-medium cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null);
                      router.push("/about");
                    }}
                  >
                    About Us
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-purple-700 hover:bg-purple-100 font-medium cursor-pointer"
                    onClick={() => {
                      setOpenMenu(null);
                      router.push("/recipe-ideas");
                    }}
                  >
                    Recipe Ideas
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="ml-2 px-4 py-2 rounded bg-white text-purple-700 hover:bg-gray-100 text-sm font-medium cursor-pointer"
            onClick={() => router.push("/log-in")}
          >
            Log in
          </button>
        )}
      </div>
    </nav>
  );
}
