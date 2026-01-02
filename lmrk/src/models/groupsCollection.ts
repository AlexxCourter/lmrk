import { getDb } from "../lib/mongodb";
import { Group } from "./Group";
import { Collection } from "mongodb";

export async function getGroupsCollection(): Promise<Collection<Group>> {
  const db = await getDb();
  return db.collection<Group>("groups");
}
