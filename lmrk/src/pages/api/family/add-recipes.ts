import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "../auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";
import { getUsersCollection } from "@/models/User";
import { getDb } from "@/lib/mongodb";
import type { Group } from "@/models/Group";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { recipeIds } = req.body;
  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: "No recipes provided" });
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.groupInfo?.groupEnabled || !user.groupInfo.groupId) {
      return res.status(400).json({ error: "Family sharing not enabled" });
    }

    const db = await getDb();
    const groupsCollection = db.collection<Group>("groups");
    const group = await groupsCollection.findOne({ groupId: user.groupInfo.groupId });

    if (!group) {
      return res.status(404).json({ error: "Family group not found" });
    }

    // Find the recipes from the user's recipe collection
    const recipesToAdd = (user.recipes || []).filter((recipe: { _id?: { toString(): string }; id?: string }) => 
      recipeIds.includes(recipe._id?.toString() || recipe.id || '')
    );

    if (recipesToAdd.length === 0) {
      return res.status(404).json({ error: "No matching recipes found" });
    }

    // Add recipes to the group's cookbook (avoid duplicates)
    const existingRecipeIds = (group.cookBook || []).map((r: { _id?: { toString(): string }; id?: string }) => r._id?.toString() || r.id);
    const newRecipes = recipesToAdd.filter((recipe: { _id?: { toString(): string }; id?: string }) => 
      !existingRecipeIds.includes(recipe._id?.toString() || recipe.id)
    );

    if (newRecipes.length === 0) {
      return res.status(400).json({ error: "All selected recipes are already in the family cookbook" });
    }

    await groupsCollection.updateOne(
      { groupId: user.groupInfo.groupId },
      {
        $push: {
          cookBook: { $each: newRecipes }
        }
      }
    );

    return res.status(200).json({ 
      success: true, 
      addedCount: newRecipes.length,
      recipes: newRecipes
    });
  } catch (error) {
    console.error("Error adding recipes to family cookbook:", error);
    return res.status(500).json({ error: "Failed to add recipes" });
  }
}
