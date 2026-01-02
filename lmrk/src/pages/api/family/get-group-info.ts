import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "../auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";
import { getUsersCollection } from "@/models/User";
import { getDb } from "@/lib/mongodb";
import type { Group } from "@/models/Group";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ email: session.user.email });

  if (!user || !user.groupInfo?.groupEnabled || !user.groupInfo.groupId) {
    return res.status(404).json({ error: "Not in a family group" });
  }

  const db = await getDb();
  const groupsCollection = db.collection<Group>("groups");
  const group = await groupsCollection.findOne({ groupId: user.groupInfo.groupId });

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  // Get member details
  const memberUsers = await users.find({
    _id: { $in: group.memberIds.map((id) => id as unknown as import('mongodb').ObjectId) }
  }).toArray();

  const members = memberUsers.map((member) => ({
    id: member._id!.toString(),
    email: member.email,
    username: member.username,
    profileImage: member.profileImage,
    role: member._id!.toString() === group.ownerId ? "owner" : "member",
  }));

  // Return group info with members and pending invites
  return res.status(200).json({
    groupId: group.groupId,
    name: group.name,
    ownerId: group.ownerId,
    members,
    pendingInvites: group.pendingInvites?.map((inv) => ({
      email: inv.email,
      invitedAt: inv.invitedAt,
    })) || [],
    cookBook: group.cookBook || [],
    isOwner: user._id!.toString() === group.ownerId,
  });
}
