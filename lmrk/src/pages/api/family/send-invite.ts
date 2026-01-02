import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "../auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";
import { getUsersCollection } from "@/models/User";
import { getDb } from "@/lib/mongodb";
import type { Group } from "@/models/Group";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "support@listandrecipe.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Don't allow inviting yourself
  if (email.toLowerCase() === session.user.email.toLowerCase()) {
    return res.status(400).json({ error: "Cannot invite yourself" });
  }

  const users = await getUsersCollection();
  const currentUser = await users.findOne({ email: session.user.email });

  if (!currentUser || !currentUser.groupInfo?.groupEnabled || !currentUser.groupInfo.groupId) {
    return res.status(400).json({ error: "Family sharing not enabled" });
  }

  const groupId = currentUser.groupInfo.groupId;

  // Get or create the group
  const db = await getDb();
  const groupsCollection = db.collection<Group>("groups");
  let group = await groupsCollection.findOne({ groupId });

  if (!group) {
    // Create the group if it doesn't exist
    const newGroup: Group = {
      groupId,
      name: `${currentUser.username || "User"}'s Family`,
      ownerId: currentUser._id!.toString(),
      memberIds: [currentUser._id!.toString()],
      pendingInvites: [],
      cookBook: [],
      shoppingLists: [],
      createdAt: new Date(),
    };
    await groupsCollection.insertOne(newGroup);
    
    // Re-fetch the group after inserting
    group = await groupsCollection.findOne({ groupId });
    
    if (!group) {
      return res.status(500).json({ error: "Failed to create group" });
    }
  }

  // Check if email is already a member
  const existingMember = await users.findOne({
    email: email.toLowerCase(),
    "groupInfo.groupId": groupId,
  });

  if (existingMember) {
    return res.status(400).json({ error: "User is already a member of this family" });
  }

  // Check if there's already a pending invite
  const existingInvite = group.pendingInvites?.find(
    (inv) => inv.email.toLowerCase() === email.toLowerCase()
  );

  if (existingInvite) {
    return res.status(400).json({ error: "Invite already sent to this email" });
  }

  // Generate invite token
  const inviteToken = randomBytes(32).toString("hex");

  // Add pending invite to group
  await groupsCollection.updateOne(
    { groupId },
    {
      $push: {
        pendingInvites: {
          email: email.toLowerCase(),
          inviteToken,
          invitedAt: new Date(),
          invitedBy: currentUser._id!.toString(),
        },
      },
    }
  );

  // Send email
  const inviteUrl = `${process.env.NEXTAUTH_URL || "https://listandrecipe.com"}/family/accept-invite?token=${inviteToken}`;
  
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `${currentUser.username || "Someone"} invited you to join their LMRK family!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join a family on LMRK!</h2>
          <p><strong>${currentUser.username || session.user.email}</strong> has invited you to join their family group on LMRK: List Manager & Recipe Keeper.</p>
          <p>With family sharing, you can:</p>
          <ul>
            <li>Share recipes with your family</li>
            <li>Collaborate on shopping lists</li>
            <li>Plan meals together</li>
          </ul>
          <p style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Accept Invitation</a>
          </p>
          <p style="font-size: 14px; color: #666;">
            If you don't have an LMRK account yet, you'll be able to create one after clicking the link above.
          </p>
          <p style="font-size: 12px; color: #999;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send invite email:", error);
    // Roll back the pending invite
    await groupsCollection.updateOne(
      { groupId },
      {
        $pull: {
          pendingInvites: { inviteToken },
        },
      }
    );
    return res.status(500).json({ error: "Failed to send invite email" });
  }

  return res.status(200).json({ success: true, message: "Invite sent successfully" });
}
