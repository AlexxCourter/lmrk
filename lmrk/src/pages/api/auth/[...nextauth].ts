import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { getUsersCollection } from "@/models/User";
import bcrypt from "bcryptjs";

// Extend NextAuth types to include custom user fields
declare module "next-auth" {
  interface User {
    username?: string;
    profileImage?: string;
    bio?: string;
    recipes?: any[];
    shoppingLists?: any[];
    activeList?: any;
  }
  interface Session {
    user?: {
      email?: string | null;
      username?: string;
      profileImage?: string;
      bio?: string;
      recipes?: any[];
      shoppingLists?: any[];
      activeList?: any;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    profileImage?: string;
    bio?: string;
    recipes?: any[];
    shoppingLists?: any[];
    activeList?: any;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const users = await getUsersCollection();
        const user = await users.findOne({ email: credentials.email });
        if (!user) return null;
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;
        // Map fields for session
        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          profileImage: user.profileImage,
          bio: user.bio,
          recipes: user.recipes,
          shoppingLists: user.shoppingLists,
          activeList: user.activeList, // <-- Ensure this is included
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: "/log-in",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only run for Google provider
      if (account?.provider === "google") {
        const users = await getUsersCollection();
        if (!user.email) throw new Error("Google account did not return an email.");
        const existing = await users.findOne({ email: user.email as string });
        if (!existing) {
          // Create a new user document for Google sign-in
          await users.insertOne({
                      email: user.email,
                      username: user.name || user.email.split("@")[0],
                      profileImage: user.image || "",
                      bio: "",
                      recipes: [],
                      shoppingLists: [],
                      activeList: undefined,
                      createdAt: new Date().toISOString(),
                      preferences: {
                        theme: "light",
                        notifications: true,
                        language: "en",
                      },
                      passwordHash: "",
                      referral: "",
                      // Add any other default fields here
                    });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token = {
          ...token,
          username: user.username,
          profileImage: user.profileImage,
          bio: user.bio,
          recipes: user.recipes,
          shoppingLists: user.shoppingLists,
          email: user.email,
          activeList: user.activeList, // <-- Add this line
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Always fetch latest user data from DB using email
      if (session.user?.email) {
        const users = await getUsersCollection();
        const user = await users.findOne({ email: session.user.email });
        if (user) {
          session.user = {
            ...session.user,
            username: user.username,
            profileImage: user.profileImage,
            bio: user.bio,
            recipes: user.recipes,
            shoppingLists: user.shoppingLists,
            activeList: user.activeList, // <-- Add this line
          };
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export default handler;
