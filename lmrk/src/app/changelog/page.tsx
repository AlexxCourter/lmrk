"use client";
import changelog from "../../changelog.json";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { ThemeController } from "@/theme/ThemeController";

export default function ChangelogPage() {
  const { data: session } = useSession();
  useEffect(() => {
    const userPreferences = (session?.user as { preferences?: { theme?: string } })?.preferences;
    const theme = userPreferences?.theme;
    if (theme) {
      const ctrl = ThemeController.getInstance();
      if (theme === "moonlight") ctrl.setMoonlight();
      else if (theme === "mint") ctrl.setMint();
      else ctrl.setDefault();
    }
  }, [session?.user]);
  return (
    <div className="min-h-screen w-full flex flex-col items-center py-10 px-4" style={{ background: "var(--theme-pageBg)" }}>
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-4 text-black" style={{ fontFamily: "'Bree Serif', serif" }}>
          Changelog
        </h1>
        <div className="mb-6 text-black">
          <span className="font-semibold">App:</span> {changelog.app}<br />
          <span className="font-semibold">Current Version:</span> {changelog.version} ({changelog.release})
        </div>
        {Array.isArray(changelog.changes) && changelog.changes.map((release) => (
          <div key={release.version} className="mb-8">
            <div className="text-xl font-bold text-purple-700 mb-1">
              Version {release.version} <span className="text-sm text-gray-500">({release.date})</span>
            </div>
            <ul className="list-disc list-inside ml-4 mt-2">
              {release.changes.map((change, idx) => (
                <li key={idx} className="mb-1">
                  <span className="font-semibold capitalize">{change.type}:</span> {change.description}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
