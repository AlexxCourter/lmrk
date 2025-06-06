import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(req, res, nextAuthOptions as any);
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
      name: item.name,
      quantity: item.quantity,
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
