import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";

/* eslint-disable @typescript-eslint/no-explicit-any */
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

  const { listId, name, color, dateCreated, items } = req.body;
  if (!listId || !name || !color || !dateCreated || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const users = await getUsersCollection();
  const result = await users.updateOne(
    { email: session.user.email, "shoppingLists._id": new ObjectId(listId) },
    {
      $set: {
        "shoppingLists.$.name": name,
        "shoppingLists.$.color": color,
        "shoppingLists.$.dateCreated": dateCreated,
        "shoppingLists.$.items": items.map((item: Record<string, unknown>) => ({
          _id: (typeof item._id === "string" && ObjectId.isValid(item._id)) ? new ObjectId(item._id) : new ObjectId(),
          name: item.name,
          quantity: item.quantity,
          checked: !!item.checked,
        })),
      },
    }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ error: "Failed to update shopping list" });
  }
}


