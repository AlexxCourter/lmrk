import type { NextApiRequest, NextApiResponse } from "next";
import { getUsersCollection } from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { token, newPassword } = req.body;
  if (!token || typeof token !== "string" || !newPassword || typeof newPassword !== "string") {
    return res.status(400).json({ error: "Invalid request" });
  }
  const users = await getUsersCollection();
  const user = await users.findOne({ passwordResetToken: token });
  if (!user || !user.passwordResetExpires || user.passwordResetUsed) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }
  if (Date.now() > user.passwordResetExpires) {
    return res.status(400).json({ error: "Token expired" });
  }
  // Update password and invalidate token
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await users.updateOne(
    { _id: user._id },
    { $set: { passwordHash, passwordResetUsed: true }, $unset: { passwordResetToken: "", passwordResetExpires: "" } }
  );
  return res.status(200).json({ ok: true });
}
