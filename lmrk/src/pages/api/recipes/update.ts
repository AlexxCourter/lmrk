import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection, Recipe } from "@/models/User";
import { ObjectId } from "mongodb";
import type { Session } from "next-auth";

// Inline the NextAuth config here since authOptions cannot be imported
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH" && req.method !== "PUT") return res.status(405).end();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(req, res, nextAuthOptions as any) as Session | null;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { id, ...updateFields } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing recipe id" });
  }

  const users = await getUsersCollection();

  // Prepare the update object for the recipe fields
  const updateObj: Partial<Recipe> = { ...updateFields };
  // Remove undefined fields to avoid overwriting with undefined
  Object.keys(updateObj).forEach(key => {
    if (updateObj[key as keyof Recipe] === undefined) {
      delete updateObj[key as keyof Recipe];
    }
  });

  // Update the recipe in the user's recipes array by _id or id
  const result = await users.updateOne(
    {
      email: session.user.email,
      "recipes._id": typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : id,
    },
    {
      $set: Object.fromEntries(
        Object.entries(updateObj).map(([key, value]) => [`recipes.$.${key}`, value])
      ),
    }
  );

  if (result.modifiedCount === 1) {
    // Optionally, fetch the updated recipe to return
    const user = await users.findOne({ email: session.user.email });
    const updatedRecipe =
      user?.recipes?.find(
        (r: any) =>
          (r._id?.toString?.() || r._id) === id ||
          (r.id?.toString?.() || r.id) === id
      ) || null;
    return res.status(200).json({ success: true, recipe: updatedRecipe });
  } else {
    return res.status(404).json({ error: "Recipe not found or not updated" });
  }
}
