import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function UserSettingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(nextAuthOptions as any);
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
