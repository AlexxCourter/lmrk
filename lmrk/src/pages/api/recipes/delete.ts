import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";
import type { Session } from "next-auth";

// Inline the NextAuth config here since authOptions cannot be imported
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).end();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(req, res, nextAuthOptions as any) as Session | null;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing recipe id" });
  }

  const users = await getUsersCollection();

  // Delete the recipe from the user's recipes array by _id
  const result = await users.updateOne(
    { email: session.user.email },
    {
      $pull: {
        recipes: {
          _id: typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : id,
        },
      },
    }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true, message: "Recipe deleted successfully" });
  } else {
    return res.status(404).json({ error: "Recipe not found or already deleted" });
  }
}
