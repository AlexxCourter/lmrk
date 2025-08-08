import { NextApiRequest, NextApiResponse } from "next";
import { getUsersCollection } from "@/models/User";
import { getServerSession } from "next-auth/next";
import authOptions from "./[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions as AuthOptions) as Session;
  if (!session || !session.user || !session.user.email) return res.status(401).end();
  const users = await getUsersCollection();
  const user = await users.findOne({ email: session.user.email });
  if (!user) return res.status(404).end();
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== "object") return res.status(400).end();
  await users.updateOne(
    { _id: user._id },
    { $set: { preferences: { ...user.preferences, ...preferences } } }
  );
  return res.status(200).json({ ok: true });
}
