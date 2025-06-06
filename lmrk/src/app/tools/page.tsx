import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import ToolsCards from "./ToolsCards";

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

function toPlainObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(toPlainObject);
  }
  if (obj && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      // @ts-expect-error: dynamic key
      if (key === "_id" && obj[key]?.toString) {
        // @ts-expect-error: dynamic key
        newObj[key] = obj[key].toString();
      } else {
        // @ts-expect-error: dynamic key
        newObj[key] = toPlainObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

type SessionUser = {
  recipes?: unknown[];
  shoppingLists?: unknown[];
  [key: string]: unknown;
};

type Session = {
  user?: SessionUser;
  [key: string]: unknown;
};

export default async function ToolsPage() {
  const session = (await getServerSession(
    nextAuthOptions as Record<string, unknown>
  )) as Session;
  if (!session || !session.user) {
    redirect("/");
  }

  const recipes = toPlainObject(session.user?.recipes || []) as Record<string, unknown>[];
  const shoppingLists = toPlainObject(session.user?.shoppingLists || []) as Record<string, unknown>[];

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col gap-8">
        <ToolsCards recipes={recipes} shoppingLists={shoppingLists} />
        {/* Spacer for floating menu */}
        <div style={{ height: 68 }} />
      </div>
    </div>
  );
}
