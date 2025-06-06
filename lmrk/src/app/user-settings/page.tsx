import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../authOptions";

export default async function UserSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <p>Settings for your account will be available here.</p>
    </div>
  );
}
