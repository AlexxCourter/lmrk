import type { NextApiRequest, NextApiResponse } from "next";
import { getUsersCollection } from "@/models/User";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "support@listandrecipe.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { email } = req.body;
  if (!email || typeof email !== "string") return res.status(400).end();
  const users = await getUsersCollection();
  const user = await users.findOne({ email });
  // Always return generic error if not found or no passwordHash
  if (!user || !user.passwordHash) {
    return res.status(400).json({ error: "Invalid request" });
  }
  // Generate token
  const token = randomBytes(32).toString("hex");
  const expires = Date.now() + 10 * 60 * 1000; // 10 min
  // Store token in user doc (overwrite any previous)
  await users.updateOne(
    { _id: user._id },
    { $set: { passwordResetToken: token, passwordResetExpires: expires, passwordResetUsed: false } }
  );
  // Send email
  const resetUrl = `${process.env.NEXTAUTH_URL || "https://listandrecipe.com"}/reset-password?token=${token}`;
  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 10 minutes and can only be used once.</p>`
  });
  return res.status(200).json({ ok: true });
}
