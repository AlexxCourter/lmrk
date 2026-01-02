"use client";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useEffect } from "react";
import { ThemeController } from "@/theme/ThemeController";
import { useUserData } from "@/components/UserDataProvider";
import ToolsCards from "./ToolsCards";

export default function ToolsPage() {
  const { data: sessionData, status } = useSession();
  const session = sessionData as Session | null;
  const { data: userData } = useUserData();
  
  useEffect(() => {
    if (session?.user?.preferences?.theme) {
      const ctrl = ThemeController.getInstance();
      if (session.user.preferences.theme === "moonlight") ctrl.setMoonlight();
      else if (session.user.preferences.theme === "mint") ctrl.setMint();
      else ctrl.setDefault();
    }
  }, [session?.user?.preferences?.theme]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!session || !session.user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  const user = session.user;
  // Use cached user data
  const recipes = userData?.recipes || [];
  const shoppingLists = userData?.shoppingLists || [];

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "var(--theme-pageBg)" }}
    >
      <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col gap-8">
        <ToolsCards recipes={recipes} shoppingLists={shoppingLists} user={user} />
        {/* Spacer for floating menu */}
        <div style={{ height: 68 }} />
      </div>
    </div>
  );
}
