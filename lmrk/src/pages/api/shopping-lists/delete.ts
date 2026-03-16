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
  if (req.method !== "DELETE") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as any) as Session | null;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { listIds } = req.body;
  if (!Array.isArray(listIds) || listIds.length === 0) {
    return res.status(400).json({ error: "Missing or invalid listIds" });
  }

  const users = await getUsersCollection();

  // Convert string IDs to ObjectId if valid
  const objectIds = listIds.map(id => 
    typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : id
  );

  // Delete the shopping lists from the user's shoppingLists array
  const result = await users.updateOne(
    { email: session.user.email },
    {
      $pull: {
        shoppingLists: {
          _id: { $in: objectIds },
        },
      },
    }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true, message: "Shopping lists deleted successfully" });
  } else {
    return res.status(404).json({ error: "Lists not found or already deleted" });
  }
}
