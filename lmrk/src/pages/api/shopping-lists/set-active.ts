import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getUsersCollection } from "@/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { listId } = req.body;
  // Accept null to unset activeList
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
