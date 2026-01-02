import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "../auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";
import { getUsersCollection } from "@/models/User";
import { getDb } from "@/lib/mongodb";
import type { Group } from "@/models/Group";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user already has family sharing enabled
    if (user.groupInfo?.groupEnabled) {
      return res.status(400).json({ error: "Family sharing is already enabled" });
    }

    const newGroupId = uuidv4();
    const userId = user._id!.toString();

    // Create the group
    const db = await getDb();
    const groupsCollection = db.collection<Group>("groups");

    const newGroup: Group = {
      groupId: newGroupId,
      name: `${user.username || "User"}'s Family`,
      ownerId: userId,
      memberIds: [userId],
      pendingInvites: [],
      cookBook: [],
      shoppingLists: [],
      createdAt: new Date(),
    };

    await groupsCollection.insertOne(newGroup);

    // Update user with group info
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          groupInfo: {
            groupId: newGroupId,
            groupEnabled: true,
            role: "owner",
            familyName: newGroup.name,
            joinedAt: new Date().toISOString(),
          },
        },
      }
    );

    return res.status(200).json({
      success: true,
      groupId: newGroupId,
      familyName: newGroup.name,
    });
  } catch (error) {
    console.error("Error enabling family sharing:", error);
    return res.status(500).json({ error: "Failed to enable family sharing" });
  }
}
