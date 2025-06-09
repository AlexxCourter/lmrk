"use client";
import { useSession } from "next-auth/react";
import ToolsCards from "./ToolsCards";

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

export default function ToolsPage() {
  const { data: session, status } = useSession();

  type UserWithRecipes = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    recipes?: unknown[];
    shoppingLists?: unknown[];
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!session || !session.user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  const user = session.user as UserWithRecipes;

  const recipes = Array.isArray(user.recipes)
    ? (toPlainObject(user.recipes) as Record<string, unknown>[])
    : [];
  const shoppingLists = Array.isArray(user.shoppingLists)
    ? (toPlainObject(user.shoppingLists) as Record<string, unknown>[])
    : [];

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
