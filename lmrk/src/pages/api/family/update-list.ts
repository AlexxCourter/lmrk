import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "../auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";
import { getUsersCollection } from "@/models/User";
import { getDb } from "@/lib/mongodb";
import type { Group } from "@/models/Group";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { listId, name, color, items } = req.body;
  if (!listId) {
    return res.status(400).json({ error: "List ID is required" });
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

    // Find the list in the group's shopping lists
    const listIndex = (group.shoppingLists || []).findIndex((list: { _id?: { toString(): string } }) => 
      list._id?.toString() === listId
    );

    if (listIndex === -1) {
      return res.status(404).json({ error: "Shopping list not found in family group" });
    }

    // Prepare update fields
    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields[`shoppingLists.${listIndex}.name`] = name;
    if (color !== undefined) updateFields[`shoppingLists.${listIndex}.color`] = color;
    if (items !== undefined) {
      // Ensure each item has an _id
      const itemsWithIds = items.map((item: { _id?: string; name: string; quantity?: string; checked?: boolean }) => ({
        ...item,
        _id: item._id ? new ObjectId(item._id) : new ObjectId(),
      }));
      updateFields[`shoppingLists.${listIndex}.items`] = itemsWithIds;
    }
    updateFields[`shoppingLists.${listIndex}.lastModified`] = new Date();

    // Update the list
    await groupsCollection.updateOne(
      { groupId: user.groupInfo.groupId },
      { $set: updateFields }
    );

    return res.status(200).json({ 
      success: true,
      message: "Shopping list updated successfully"
    });
  } catch (error) {
    console.error("Error updating family shopping list:", error);
    return res.status(500).json({ error: "Failed to update shopping list" });
  }
}
