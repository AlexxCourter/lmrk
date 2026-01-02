import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
// import NextAuth from "next-auth";
import { getUsersCollection } from "@/models/User";

// Inline minimal NextAuth config for getServerSession
const nextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

// Simple sanitization function
function sanitize(input: string) {
  return typeof input === "string" ? input.replace(/[<>"'`]/g, "").trim() : "";
}

export async function GET() {
  const session = (await getServerSession(
    nextAuthOptions as Record<string, unknown>
  )) as { user?: { email?: string } } | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ email: session.user.email });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    recipes: user.recipes || [],
    shoppingLists: user.shoppingLists || [],
    activeList: user.activeList,
    groupInfo: user.groupInfo || null,
  });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(
    nextAuthOptions as Record<string, unknown>
  )) as { user?: { email?: string } } | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, bio, profileImage } = await req.json();

  // Only update fields that are present in the request
  const updateFields: Record<string, unknown> = {};
  if (typeof username === "string")
    updateFields.username = sanitize(username).slice(0, 32);
  if (typeof bio === "string") updateFields.bio = sanitize(bio).slice(0, 200);
  if (typeof profileImage === "string")
    updateFields.profileImage = profileImage;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 }
    );
  }

  const users = await getUsersCollection();
  const result = await users.updateOne(
    { email: session.user.email },
    { $set: updateFields }
  );

  if (result.modifiedCount === 1) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "Profile not updated." }, { status: 500 });
  }
}
