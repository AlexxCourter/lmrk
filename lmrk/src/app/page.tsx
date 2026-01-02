"use client";
import { FaListUl, FaUtensils, FaShoppingCart, FaUserPlus, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";
import changelog from "../changelog.json";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { ThemeController } from "@/theme/ThemeController";

export default function HomePage() {
  const { data: session } = useSession();
  const currentVersion = changelog.version || "Alpha 1.0";
  const release = changelog.release;

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
    <section className="flex flex-col items-center min-h-screen w-full px-4 py-8" style={{ background: "var(--theme-pageBg)" }}>
      {/* App Title and Tagline */}
      <div className="mt-8 mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 drop-shadow-lg" style={{ color: "var(--theme-menuBarText)" }}>
          LMRK: List Manager & Recipe Keeper
        </h1>
        <p className="text-lg sm:text-xl font-medium max-w-2xl mx-auto" style={{ color: "var(--theme-menuBarText)", opacity: 0.85 }}>
          Simplify shopping and meal planning by seamlessly integrating your recipes and shopping lists.
        </p>
        <div className="mt-2 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--theme-main)" }}>
          <Link href="/changelog" className="hover:underline">
            {release} {currentVersion}
          </Link>
        </div>
      </div>

      {/* Infographic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl my-8">
        {/* Recipes Card */}
        <div className="rounded-xl shadow-lg flex flex-col items-center p-6 text-center" style={{ background: "var(--theme-floatingMenuBg)" }}>
          <FaUtensils className="text-4xl mb-3" style={{ color: "var(--theme-main)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--theme-main)" }}>Save & Organize Recipes</h2>
          <p className="mb-2" style={{ color: "var(--theme-pageSubText)", opacity: 0.85 }}>
            Store your favorite recipes, add ingredients, and keep instructions handy for every meal.
          </p>
          <span className="inline-block text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--theme-main)", color: "#fff" }}>
            Meal Planning
          </span>
        </div>
        {/* Shopping Lists Card */}
        <div className="rounded-xl shadow-lg flex flex-col items-center p-6 text-center" style={{ background: "var(--theme-floatingMenuBg)" }}>
          <FaShoppingCart className="text-4xl mb-3" style={{ color: "var(--theme-main)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--theme-main)" }}>Smart Shopping Lists</h2>
          <p className="mb-2" style={{ color: "var(--theme-pageSubText)", opacity: 0.85 }}>
            Create, edit, and manage shopping lists. Add recipe ingredients directly to your lists with one click.
          </p>
          <span className="inline-block text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--theme-main)", color: "#fff" }}>
            Seamless Integration
          </span>
        </div>
        {/* Integration Card */}
        <div className="rounded-xl shadow-lg flex flex-col items-center p-6 text-center" style={{ background: "var(--theme-floatingMenuBg)" }}>
          <FaListUl className="text-4xl mb-3" style={{ color: "var(--theme-main)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--theme-main)" }}>All-in-One Organizer</h2>
          <p className="mb-2" style={{ color: "var(--theme-pageSubText)", opacity: 0.85 }}>
            Effortlessly switch between meal planning and shopping. LMRK keeps everything in sync for you.
          </p>
          <span className="inline-block text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--theme-main)", color: "#fff" }}>
            Simplified Life
          </span>
        </div>
      </div>

      {/* Development Status */}
      <div className="flex items-center gap-2 mb-8">
        <FaCheckCircle style={{ color: "var(--theme-main)" }} />
        <Link href="/changelog" className="text-sm font-medium hover:underline" style={{ color: "var(--theme-menuBarText)" }}>
          Currently in <span className="font-bold">{release} {currentVersion}</span> — Features and design are evolving!
        </Link>
      </div>

      {/* Call to Action */}
      {!session?.user && (
        <Link
          href="/log-in"
          className="flex items-center gap-2 font-bold px-8 py-3 rounded-full text-lg shadow-lg transition"
          style={{ background: "var(--theme-main)", color: "#fff" }}
        >
          <FaUserPlus className="text-xl" />
          Create Your Free Account
        </Link>
      )}
    </section>
  );
}
