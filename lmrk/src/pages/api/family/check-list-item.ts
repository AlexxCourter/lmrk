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
  if (req.method !== "PATCH") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { listId, itemId, checked, lastModified } = req.body;
  if (!listId || !itemId || typeof checked !== "boolean") {
    return res.status(400).json({ error: "Missing fields" });
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
    
    // If lastModified is provided, check if the item was modified more recently
    // This helps prevent overwriting changes made by others
    if (lastModified) {
      const group = await groupsCollection.findOne({ 
        groupId: user.groupInfo.groupId,
        "shoppingLists._id": new ObjectId(listId),
        "shoppingLists.items._id": new ObjectId(itemId)
      });

      if (group) {
        const list = group.shoppingLists?.find((l: { _id?: { toString(): string } }) => 
          l._id?.toString() === listId
        );
        const item = list?.items?.find((i: { _id?: { toString(): string } }) => 
          i._id?.toString() === itemId
        );
        
        // Check if item has a lastModified timestamp and if it's newer than the one we have
        const itemLastModified = (item as unknown as { lastModified?: Date })?.lastModified;
        if (itemLastModified && new Date(itemLastModified) > new Date(lastModified)) {
          // Item was modified more recently by someone else, return conflict
          return res.status(409).json({ 
            error: "Item was modified by another user",
            currentState: item
          });
        }
      }
    }

    // Update the item with the new checked state and timestamp
    const result = await groupsCollection.updateOne(
      { 
        groupId: user.groupInfo.groupId,
        "shoppingLists._id": new ObjectId(listId),
        "shoppingLists.items._id": new ObjectId(itemId)
      },
      { 
        $set: { 
          "shoppingLists.$[list].items.$[item].checked": checked,
          "shoppingLists.$[list].items.$[item].lastModified": new Date()
        } 
      },
      {
        arrayFilters: [
          { "list._id": new ObjectId(listId) },
          { "item._id": new ObjectId(itemId) }
        ]
      }
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({ success: true, lastModified: new Date() });
    } else {
      return res.status(500).json({ error: "Failed to update item" });
    }
  } catch (error) {
    console.error("Error checking list item:", error);
    return res.status(500).json({ error: "Failed to update item" });
  }
}
