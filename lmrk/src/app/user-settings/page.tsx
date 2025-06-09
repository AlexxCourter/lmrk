import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

type SessionUser = {
  recipes?: unknown[];
  shoppingLists?: unknown[];
  [key: string]: unknown;
};

type Session = {
  user?: SessionUser;
  [key: string]: unknown;
} | null;

export default async function UserSettingsPage() {
  const session = (await getServerSession(
    nextAuthOptions as Record<string, unknown>
  )) as Session;
  if (!session || !session.user) {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <p>Settings for your account will be available here.</p>
    </div>
  );
}
