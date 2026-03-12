import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";
import type { Session } from "next-auth";


// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(req, res, nextAuthOptions as any) as Session | null;
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { ingredients } = req.body;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "No ingredients provided" });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ email: session.user.email });
  if (!user?.activeList) return res.status(400).json({ error: "No active shopping list set" });

  // Find the active shopping list
  const activeList = user.shoppingLists?.find((list: { _id?: { toString(): string } }) => 
    list._id?.toString() === user.activeList
  );

  if (!activeList) {
    return res.status(404).json({ error: "Active shopping list not found" });
  }

  // Get existing items in the list
  const existingItems = (activeList.items || []) as { _id?: ObjectId; name: string; quantity?: string; checked?: boolean }[];
  
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

  ingredients.forEach((ing: { name?: string; quantity?: string; unit?: string }) => {
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
    await users.updateOne(
      { email: session.user.email, "shoppingLists._id": new ObjectId(user.activeList) },
      { $push: { "shoppingLists.$.items": { $each: itemsToAdd } } }
    );
  }

  // Update existing items with new quantities
  for (const update of itemsToUpdate) {
    await users.updateOne(
      { 
        email: session.user.email,
        "shoppingLists._id": new ObjectId(user.activeList),
        "shoppingLists.items._id": update.itemId
      },
      { 
        $set: { 
          "shoppingLists.$[list].items.$[item].quantity": update.newQuantity
        } 
      },
      {
        arrayFilters: [
          { "list._id": new ObjectId(user.activeList) },
          { "item._id": update.itemId }
        ]
      }
    );
  }

  return res.status(200).json({ 
    success: true,
    addedCount: itemsToAdd.length,
    updatedCount: itemsToUpdate.length
  });
}
