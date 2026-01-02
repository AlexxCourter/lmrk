import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import UserSettingsClient from "./UserSettingsClient";

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

// Server component
export default async function UserSettingsPage() {
  const session = (await getServerSession(
    nextAuthOptions as Record<string, unknown>
  )) as Session;
  if (!session || !session.user) {
    redirect("/");
  }
  // No need to pass user, client will use useSession
  return <UserSettingsClient />;
}
