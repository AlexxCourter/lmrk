import { Collection, ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb";

// export interface ShoppingListItem {
//   id: string;
//   name: string;
//   quantity: number;
//   checked: boolean;
// }

// export interface ShoppingList {
//   id: string;
//   name: string;
//   items: ShoppingListItem[];
// }

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

// export interface Recipe {
//   id: string;
//   name: string;
//   ingredients: RecipeIngredient[];
//   instructions: string[];
// }

export interface User {
  _id?: ObjectId;
  createdAt: string;
  username: string;
  email: string;
  profileImage: string;
  bio: string;
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
  shoppingLists: ShoppingList[];
  recipes: Recipe[];
  passwordHash: string;
  referral?: string;
  activeList?: string; // Add this line for the active shopping list id
}

export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>("users");
}

// Add this for recipe structure reference
export type Recipe = {
  _id?: ObjectId;
  name: string;
  icon: number; // index of icon
  description: string;
  ingredients: { name: string; amount: string; measure: string }[];
  instructions: string[];
};

export type ShoppingListItem = {
  _id?: ObjectId | string;
  name: string;
  quantity: string;
  checked: boolean;
};

export type ShoppingList = {
  _id?: ObjectId | string;
  name: string;
  color: string; // hex or color name
  dateCreated: string; // ISO string or formatted
  items: ShoppingListItem[];
};
