import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "../auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";
import { getUsersCollection } from "@/models/User";
import { getDb } from "@/lib/mongodb";
import type { Group } from "@/models/Group";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { listIds } = req.body;
  if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
    return res.status(400).json({ error: "No shopping lists provided" });
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.groupInfo?.groupEnabled || !user.groupInfo.groupId) {
      return res.status(400).json({ error: "Family sharing not enabled" });
    }

    const db = await getDb();
    const groupsCollection = db.collection<Group>("groups");
    const group = await groupsCollection.findOne({ groupId: user.groupInfo.groupId });

    if (!group) {
      return res.status(404).json({ error: "Family group not found" });
    }

    // Find the shopping lists from the user's collection
    const listsToAdd = (user.shoppingLists || []).filter((list: { _id?: { toString(): string }; id?: string }) => 
      listIds.includes(list._id?.toString() || list.id || '')
    );

    if (listsToAdd.length === 0) {
      return res.status(404).json({ error: "No matching shopping lists found" });
    }

    // Add lists to the group's shopping lists (avoid duplicates)
    const existingListIds = (group.shoppingLists || []).map((l: { _id?: { toString(): string }; id?: string }) => l._id?.toString() || l.id);
    const newLists = listsToAdd.filter((list: { _id?: { toString(): string }; id?: string }) => 
      !existingListIds.includes(list._id?.toString() || list.id)
    );

    if (newLists.length === 0) {
      return res.status(400).json({ error: "All selected lists are already in the family shopping lists" });
    }

    await groupsCollection.updateOne(
      { groupId: user.groupInfo.groupId },
      {
        $push: {
          shoppingLists: { $each: newLists }
        }
      }
    );

    return res.status(200).json({ 
      success: true, 
      addedCount: newLists.length,
      lists: newLists
    });
  } catch (error) {
    console.error("Error adding shopping lists to family:", error);
    return res.status(500).json({ error: "Failed to add shopping lists" });
  }
}
