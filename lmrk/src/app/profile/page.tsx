"use client";
import { useSession } from "next-auth/react";
import ClientProfile from "./ClientProfile";

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

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
  const recipes = Array.isArray(user.recipes) ? user.recipes : [];
  const shoppingLists = Array.isArray(user.shoppingLists)
    ? user.shoppingLists
    : [];

  return (
    <ClientProfile
      profileImage={profileImage}
      username={username}
      email={user.email ?? ""}
      bio={bio}
      recipesCount={recipes.length}
      shoppingListsCount={shoppingLists.length}
    />
  );
}
