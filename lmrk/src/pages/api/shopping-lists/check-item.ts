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
  if (req.method !== "PATCH") return res.status(405).end();

  interface SessionUser {
    email?: string;
    [key: string]: unknown;
  }
  interface Session {
    user?: SessionUser;
    [key: string]: unknown;
  }
  const session = await getServerSession(req, res, nextAuthOptions as any) as Session;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { listId, itemId, checked } = req.body;
  if (!listId || !itemId || typeof checked !== "boolean") {
    return res.status(400).json({ error: "Missing fields" });
  }

  const users = await getUsersCollection();
  const result = await users.updateOne(
    { email: session.user.email, "shoppingLists._id": new ObjectId(listId), "shoppingLists.items._id": new ObjectId(itemId) },
    { $set: { "shoppingLists.$[list].items.$[item].checked": checked } },
    {
      arrayFilters: [
        { "list._id": new ObjectId(listId) },
        { "item._id": new ObjectId(itemId) }
      ]
    }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ error: "Failed to update item" });
  }
}
