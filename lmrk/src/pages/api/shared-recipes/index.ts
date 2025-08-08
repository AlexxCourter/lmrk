import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/mongodb";

import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import { ObjectId } from "mongodb";
import type { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();
  const sharedRecipes = db.collection("shared-recipes");

  if (req.method === "GET") {
    // Return all shared recipes
    const docs = await sharedRecipes.find({}).toArray();
    res.status(200).json({ sharedRecipes: docs });
    return;
  }

  if (req.method === "POST") {
    // Share a recipe
  const session = await getServerSession(req, res, authOptions) as Session | null;
    if (!session || !session.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const { recipeId, username, userId } = req.body;
    if (!recipeId || !username || !userId) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    // Find the user's recipe
    const users = db.collection("users");
    const user = await users.findOne({ email: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
  const recipe = (user.recipes || []).find((r: Record<string, unknown>) => String(r._id) === String(recipeId));
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    // Set user's sharedRecipe
    await users.updateOne({ email: userId }, { $set: { sharedRecipe: String(recipeId) } });
    // Insert into shared-recipes (upsert by userId, use recipeId as _id for uniqueness)
    const sharedId = ObjectId.isValid(recipeId) ? new ObjectId(recipeId) : recipeId;
    await sharedRecipes.updateOne(
      { _id: sharedId },
      {
        $set: {
          _id: sharedId,
          userId,
          username,
          recipe: { ...recipe },
        },
      },
      { upsert: true }
    );
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
