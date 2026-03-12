import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import nextAuthOptions from "../auth/[...nextauth]";
import type { AuthOptions } from "next-auth/core/types";
import { Session } from "next-auth";
import { getUsersCollection } from "@/models/User";
import { getDb } from "@/lib/mongodb";
import type { Group } from "@/models/Group";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, nextAuthOptions as AuthOptions) as Session;
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { recipeId, listId } = req.body;
  if (!recipeId || !listId) {
    return res.status(400).json({ error: "Missing recipeId or listId" });
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

    // Find the recipe in the family cookbook
    const recipe = group.cookBook?.find((r: { _id?: { toString(): string }; id?: string }) => 
      (r._id?.toString() || r.id) === recipeId
    );

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found in family cookbook" });
    }

    // Find the target shopping list
    const targetList = group.shoppingLists?.find((l: { _id?: { toString(): string } }) => 
      l._id?.toString() === listId
    );

    if (!targetList) {
      return res.status(404).json({ error: "Shopping list not found" });
    }

    // Get recipe ingredients
    const ingredients = (recipe.ingredients || []) as { name?: string; quantity?: string; unit?: string }[];
    
    if (ingredients.length === 0) {
      return res.status(400).json({ error: "Recipe has no ingredients" });
    }

    // Get existing items in the list
    const existingItems = (targetList.items || []) as { _id?: ObjectId; name: string; quantity?: string; checked?: boolean }[];
    
    // Create a map of existing items (case-insensitive)
    const existingItemsMap = new Map<string, { _id?: ObjectId; name: string; quantity: string; checked?: boolean }>();
    existingItems.forEach(item => {
      const lowerName = item.name.toLowerCase().trim();
      existingItemsMap.set(lowerName, {
        _id: item._id,
        name: item.name,
        quantity: item.quantity || "1",
        checked: item.checked,
      });
    });

    // Process ingredients and consolidate duplicates
    const itemsToAdd: { _id: ObjectId; name: string; quantity: string; checked: boolean }[] = [];
    const itemsToUpdate: { itemId: ObjectId; newQuantity: string }[] = [];

    ingredients.forEach(ing => {
      if (!ing.name) return;
      
      const lowerName = ing.name.toLowerCase().trim();
      const existingItem = existingItemsMap.get(lowerName);
      
      if (existingItem && existingItem._id) {
        // Item exists - update quantity
        const existingQty = parseFloat(existingItem.quantity) || 1;
        const newQty = parseFloat(ing.quantity || "1") || 1;
        const totalQty = existingQty + newQty;
        
        itemsToUpdate.push({
          itemId: existingItem._id,
          newQuantity: `${totalQty}${ing.unit ? ' ' + ing.unit : ''}`,
        });
      } else {
        // New item - add it
        const quantityStr = ing.quantity && ing.unit 
          ? `${ing.quantity} ${ing.unit}`
          : ing.quantity 
          ? ing.quantity 
          : "1";
        
        itemsToAdd.push({
          _id: new ObjectId(),
          name: ing.name,
          quantity: quantityStr,
          checked: false,
        });
      }
    });

    // Perform database updates
    if (itemsToAdd.length > 0) {
      // Add new items
      await groupsCollection.updateOne(
        { 
          groupId: user.groupInfo.groupId,
          "shoppingLists._id": new ObjectId(listId)
        },
        { 
          $push: { 
            "shoppingLists.$.items": { $each: itemsToAdd }
          } 
        }
      );
    }

    // Update existing items with new quantities
    for (const update of itemsToUpdate) {
      await groupsCollection.updateOne(
        { 
          groupId: user.groupInfo.groupId,
          "shoppingLists._id": new ObjectId(listId),
          "shoppingLists.items._id": update.itemId
        },
        { 
          $set: { 
            "shoppingLists.$[list].items.$[item].quantity": update.newQuantity
          } 
        },
        {
          arrayFilters: [
            { "list._id": new ObjectId(listId) },
            { "item._id": update.itemId }
          ]
        }
      );
    }

    return res.status(200).json({ 
      success: true,
      addedCount: itemsToAdd.length,
      updatedCount: itemsToUpdate.length,
      message: `Added ${itemsToAdd.length} new items and updated ${itemsToUpdate.length} existing items`
    });
  } catch (error) {
    console.error("Error adding recipe to shopping list:", error);
    return res.status(500).json({ error: "Failed to add recipe to shopping list" });
  }
}
