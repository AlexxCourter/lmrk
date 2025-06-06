import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getUsersCollection } from "@/models/User";

// Simple sanitization function
function sanitize(input: string) {
  return typeof input === "string" ? input.replace(/[<>"'`]/g, "").trim() : "";
}

export async function POST(req: NextRequest) {
  // Get session for authentication
  const session = await getServerSession(authOptions);
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
