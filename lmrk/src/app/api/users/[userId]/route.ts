import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/models/User";

export async function GET(
  req: NextRequest,
  params: { params: { userId: string } }
) {
  const users = await getUsersCollection();
  const user = await users.findOne({ userId: params.params.userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}
