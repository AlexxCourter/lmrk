import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import ClientProfile from "./ClientProfile";

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

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

type Session = {
  user?: User;
  [key: string]: unknown;
} | null;

export default async function ProfilePage() {
  const session = (await getServerSession(
    nextAuthOptions as Record<string, unknown>
  )) as Session;
  if (!session || !session.user) {
    redirect("/");
  }

  const user = session.user as User;
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 mt-8 sm:mt-16">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="text-red-600">User not found.</p>
      </div>
    );
  }

  const profileImage = user.profileImage || user.image || "";
  const username = user.username || "No username set";
  const bio = user.bio || "";
  const recipes = user.recipes || [];
  const shoppingLists = user.shoppingLists || [];

  return (
    <ClientProfile
      profileImage={profileImage ?? ""}
      username={username ?? ""}
      email={user.email ?? ""}
      bio={bio ?? ""}
      recipesCount={recipes.length}
      shoppingListsCount={shoppingLists.length}
    ></ClientProfile>
  );
}
