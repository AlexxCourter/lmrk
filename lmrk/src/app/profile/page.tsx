
"use client";
import { useSession } from "next-auth/react";
import ClientProfile from "./ClientProfile";
import { ThemeController } from "@/theme/ThemeController";
import { useEffect } from "react";
import { useUserData } from "@/components/UserDataProvider";

type User = {
  email?: string | null;
  username?: string;
  profileImage?: string;
  image?: string;
  bio?: string;
  recipes?: Record<string, unknown>[];
  shoppingLists?: Record<string, unknown>[];
  activeList?: string | null;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { data: userData } = useUserData();

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

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-pageBg)" }}>Loading...</div>;
  }
  if (!session || !session.user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  const user = session.user as User;
  const profileImage =
    (typeof user.profileImage === "string" && user.profileImage) ||
    (typeof user.image === "string" && user.image) ||
    "";
  const username =
    (typeof user.username === "string" && user.username) || "No username set";
  const bio = typeof user.bio === "string" ? user.bio : "";
  
  // Use cached user data for counts
  const recipes = userData?.recipes || [];
  const shoppingLists = userData?.shoppingLists || [];

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "var(--theme-pageBg)" }}>
      <ClientProfile
        profileImage={profileImage}
        username={username}
        email={user.email ?? ""}
        bio={bio}
        recipesCount={recipes.length}
        shoppingListsCount={shoppingLists.length}
      />
    </div>
  );
}
