import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";
import type { Session } from "next-auth";


// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(req, res, nextAuthOptions as any) as Session | null;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { ingredients } = req.body;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "No ingredients provided" });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ email: session.user.email });
  if (!user?.activeList) return res.status(400).json({ error: "No active shopping list set" });

  // Prepare items to add
  const items = ingredients.map((ing: Record<string, unknown>) => ({
    _id: new ObjectId(),
    name: ing.name,
    quantity: "1",
    checked: false,
  }));

  const result = await users.updateOne(
    { email: session.user.email, "shoppingLists._id": new ObjectId(user.activeList) },
    { $push: { "shoppingLists.$.items": { $each: items } } }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ error: "Failed to add items" });
  }
}
