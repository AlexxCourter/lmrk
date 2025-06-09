import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "@/models/User";
import type { Session } from "next-auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as any) as Session | null;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { listId } = req.body;
  const users = await getUsersCollection();
  const result = await users.updateOne(
    { email: session.user.email },
    { $set: { activeList: listId || null } }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ error: "Failed to set active list" });
  }
}
