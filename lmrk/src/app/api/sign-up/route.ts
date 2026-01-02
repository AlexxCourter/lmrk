import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/models/User";
import bcrypt from "bcryptjs"; // Changed from 'bcrypt' to 'bcryptjs'

// Simple sanitization function
function sanitize(input: string) {
  return input.replace(/[<>"'`]/g, "");
}

export async function POST(req: NextRequest) {
  const { email, password, referral } = await req.json();

  // Basic validation
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length < 3 ||
    password.length < 6
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Sanitize inputs
  const safeEmail = sanitize(email);
  const safeReferral = referral ? sanitize(referral) : "";

  // Check if user already exists
  const users = await getUsersCollection();
  const existingUser = await users.findOne({ email: safeEmail });
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user object with all required fields and defaults
  const newUser = {
    createdAt: new Date().toISOString(),
    passwordHash,
    username: "",
    email: safeEmail,
    profileImage: "",
    bio: "",
    preferences: {
      theme: "light",
      notifications: false,
      newsletter: false,
      language: "en-US",
    },
    shoppingLists: [],
    recipes: [], // Will store recipes with mealType, tags, color, etc.
    referral: safeReferral,
  };

  // Insert user
  await users.insertOne(newUser);

  return NextResponse.json({ success: true });
}
