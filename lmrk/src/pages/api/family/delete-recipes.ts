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
  if (req.method !== "DELETE") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No recipe IDs provided" });
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
    
    // Convert string IDs to ObjectIds
    const objectIds = ids.map(id => new ObjectId(id));
    
    // Remove recipes from the group's cookbook
    const result = await groupsCollection.updateOne(
      { groupId: user.groupInfo.groupId },
      {
        $pull: {
          cookBook: {
            _id: { $in: objectIds }
          }
        }
      }
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({ 
        success: true,
        deletedCount: ids.length
      });
    } else {
      return res.status(500).json({ error: "Failed to delete recipes" });
    }
  } catch (error) {
    console.error("Error deleting recipes:", error);
    return res.status(500).json({ error: "Failed to delete recipes" });
  }
}
