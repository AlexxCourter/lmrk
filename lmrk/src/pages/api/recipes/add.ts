import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getUsersCollection, Recipe } from "@/models/User";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const { name, icon, description, ingredients, instructions } = req.body;
  if (!name || !ingredients || !instructions) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const users = await getUsersCollection();
  const recipe: Recipe = {
    _id: new ObjectId(),
    name,
    icon,
    description,
    ingredients,
    instructions,
  };

  const result = await users.updateOne(
    { email: session.user.email },
    { $push: { recipes: recipe } }
  );

  if (result.modifiedCount === 1) {
    return res.status(200).json({ success: true, recipe });
  } else {
    return res.status(500).json({ error: "Failed to add recipe" });
  }
}
