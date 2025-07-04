/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/models/User";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  context: any
) {
  const userId = context.params.userId;
  const users = await getUsersCollection();
  try {
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
}
