import { NextApiRequest, NextApiResponse } from "next";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import type { Session } from "next-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();
  const sharedRecipes = db.collection("shared-recipes");

  if (req.method === "POST") {
    // Save a shared recipe to user's recipes
  const session = await getServerSession(req, res, authOptions) as Session | null;
    if (!session || !session.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const { sharedRecipeId } = req.body;
    if (!sharedRecipeId) {
      res.status(400).json({ error: "Missing sharedRecipeId" });
      return;
    }
    // Find the shared recipe (convert to ObjectId if needed)
    let sharedObjId: ObjectId | null = null;
    try {
      sharedObjId = typeof sharedRecipeId === "string" ? new ObjectId(sharedRecipeId) : sharedRecipeId;
    } catch {
      res.status(400).json({ error: "Invalid sharedRecipeId" });
      return;
    }
    if (!sharedObjId) {
      res.status(400).json({ error: "Invalid sharedRecipeId" });
      return;
    }
    const shared = await sharedRecipes.findOne({ _id: sharedObjId });
    if (!shared) {
      res.status(404).json({ error: "Shared recipe not found" });
      return;
    }
    // Add to user's recipes
    const users = db.collection("users");
    const user = await users.findOne({ email: session.user.email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Clone the recipe, assign a new _id
    const newRecipe = { ...shared.recipe, _id: new Date().getTime().toString() };
    await users.updateOne(
      { email: session.user.email },
      { $push: { recipes: newRecipe } }
    );
    res.status(200).json({ ok: true, recipe: newRecipe });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
