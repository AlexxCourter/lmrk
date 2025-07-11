import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";
import type { Session } from "next-auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as any) as Session | null;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { name, color, dateCreated, items } = req.body;
  if (!name || !color || !dateCreated || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const users = await getUsersCollection();
  const shoppingList = {
    _id: new ObjectId(),
    name,
    color,
    dateCreated,
    items: items.map((item: Record<string, unknown>) => ({
      _id: new ObjectId(),
      name: String(item.name),
      quantity: String(item.quantity),
      checked: !!item.checked,
    })),
  };

  const result = await users.updateOne(
    { email: session.user.email },
    { $push: { shoppingLists: shoppingList } }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true, shoppingList });
  } else {
    return res.status(500).json({ error: "Failed to add shopping list" });
  }
}
