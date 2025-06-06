import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  context: { params: { userId: string } }
) {
  const { userId } = context.params;
  const users = await getUsersCollection();
  // If you want to look up by MongoDB ObjectId:
  let user;
  try {
    user = await users.findOne({ _id: new ObjectId(userId) });
  } catch {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}
