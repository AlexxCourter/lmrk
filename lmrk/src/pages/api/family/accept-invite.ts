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

  const { token } = req.body;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Invalid token" });
  }

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized - please log in first" });
  }

  const db = await getDb();
  const groupsCollection = db.collection<Group>("groups");

  // Find the group with this pending invite
  const group = await groupsCollection.findOne({
    "pendingInvites.inviteToken": token,
  });

  if (!group) {
    return res.status(404).json({ error: "Invalid or expired invitation" });
  }

  // Find the specific invite
  const invite = group.pendingInvites?.find((inv) => inv.inviteToken === token);
  if (!invite) {
    return res.status(404).json({ error: "Invitation not found" });
  }

  // Verify the email matches (case-insensitive)
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return res.status(403).json({ 
      error: "This invitation was sent to a different email address",
      invitedEmail: invite.email
    });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ email: session.user.email });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Check if user is already in a family group
  if (user.groupInfo?.groupEnabled && user.groupInfo.groupId !== group.groupId) {
    return res.status(400).json({ 
      error: "You are already a member of another family. Please leave your current family first." 
    });
  }

  // Check if user is already a member of this group
  if (group.memberIds.includes(user._id!.toString())) {
    // Remove the pending invite since they're already a member
    await groupsCollection.updateOne(
      { groupId: group.groupId },
      {
        $pull: {
          pendingInvites: { inviteToken: token },
        },
      }
    );
    return res.status(400).json({ error: "You are already a member of this family" });
  }

  // Add user to the group
  await groupsCollection.updateOne(
    { groupId: group.groupId },
    {
      $push: {
        memberIds: user._id!.toString(),
      },
      $pull: {
        pendingInvites: { inviteToken: token },
      },
    }
  );

  // Update user's groupInfo
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        groupInfo: {
          groupId: group.groupId,
          groupEnabled: true,
          role: "member",
          familyName: group.name,
          joinedAt: new Date().toISOString(),
        },
      },
    }
  );

  return res.status(200).json({ 
    success: true, 
    groupId: group.groupId,
    groupName: group.name 
  });
}
