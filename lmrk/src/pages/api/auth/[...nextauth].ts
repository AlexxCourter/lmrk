/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth/next";
import type { AuthOptions } from "next-auth/core/types";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUsersCollection } from "@/models/User";
import bcrypt from "bcryptjs";
import type { User, Session } from "next-auth";
import type { Account } from "next-auth/core/types";
import type { JWT } from "next-auth/jwt";

// --- NextAuth Configuration ---
const nextAuthOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        // NextAuth expects an "id" property on the returned profile object.
        // Google returns "sub" as the unique identifier.
        return {
          id: profile.sub, // <-- Fix: set id from sub
          name: profile.name ?? null,
          email: profile.email ?? null,
          image: profile.picture ?? null,
          emailVerified: profile.email_verified ?? null,
        };
      },
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
        if (!user || !user._id) return null;
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;
        return {
          id: user._id.toString(),
          name: user.username ?? null,
          email: user.email ?? null,
          image: user.profileImage ?? null,
          createdAt: user.createdAt,
          username: user.username,
          profileImage: user.profileImage,
          bio: user.bio,
          preferences: user.preferences,
          recipes: user.recipes,
          shoppingLists: user.shoppingLists,
          passwordHash: user.passwordHash,
          referral: user.referral,
          activeList: typeof user.activeList === "string" ? user.activeList : undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: "/log-in",
  },
  callbacks: {
    async signIn(params: Record<string, any>): Promise<boolean> {
      const { user, account } = params;
      if (account?.provider === "google") {
        const users = await getUsersCollection();
        // Try to find by a_id (Google sub)
        let existing = null;
        if (account.providerAccountId) {
          existing = await users.findOne({ a_id: account.providerAccountId });
        }
        // Fallback to email if not found
        if (!existing && user.email && typeof user.email === "string") {
          existing = await users.findOne({ email: user.email });
        }
        if (!existing) {
          await users.insertOne({
            email: user.email,
            username: user.name || (typeof user.email === "string" ? user.email.split("@")[0] : ""),
            profileImage: user.image || "",
            bio: "",
            recipes: [],
            shoppingLists: [],
            activeList: undefined,
            createdAt: new Date().toISOString(),
            preferences: {
              theme: "light",
              notifications: false,
              language: "en",
            },
            passwordHash: "",
            referral: "",
            a_id: account.providerAccountId || "",
          });
        } else if (!existing.a_id && account.providerAccountId) {
          // If user exists but doesn't have a_id, update it
          await users.updateOne(
            { _id: existing._id },
            { $set: { a_id: account.providerAccountId } }
          );
        }
      }
      return true;
    },
    async session(
      params: {
        session: Session;
        token: JWT;
        newSession?: any;
        trigger?: "update";
      }
    ) {
      const { session, token } = params;
      if (!session.user) session.user = {};

      // Defensive: always assign and fallback to empty string/array as needed
      session.user._id = typeof token._id === "string" ? token._id : undefined;
      session.user.createdAt = typeof token.createdAt === "string" ? token.createdAt : undefined;
      session.user.username = typeof token.username === "string" ? token.username : "";
      session.user.profileImage = typeof token.profileImage === "string" ? token.profileImage : "";
      session.user.bio = typeof token.bio === "string" ? token.bio : "";
      session.user.preferences = token.preferences ?? {};
      session.user.recipes = Array.isArray(token.recipes) ? token.recipes : [];
      session.user.shoppingLists = Array.isArray(token.shoppingLists) ? token.shoppingLists : [];
      session.user.passwordHash = typeof token.passwordHash === "string" ? token.passwordHash : "";
      session.user.referral = typeof token.referral === "string" ? token.referral : "";
      session.user.activeList = typeof token.activeList === "string" ? token.activeList : undefined;

      session.user.email = typeof token.email === "string" ? token.email : "";
      session.user.name = typeof token.name === "string" ? token.name : "";
      session.user.image = typeof token.image === "string" ? token.image : "";

      // Ensure the returned session object includes the required 'expires' property
      return {
        ...(session as Session & { expires?: string }),
        expires: (session as { expires?: string }).expires ?? (typeof token.exp === "string" ? token.exp : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()),
      };
    },
    async jwt(params: {
      token: JWT;
      user?: User | null;
      account?: Account | null;
      trigger?: "update" | "signIn" | "signUp";
      isNewUser?: boolean;
      session?: any;
    }) {
      const { token, user } = params;
      if (user) {
        // On initial sign in, copy user fields to token
        token._id = (user as any)._id ?? "";
        token.createdAt = (user as any).createdAt ?? "";
        token.username = (user as any).username ?? "";
        token.profileImage = (user as any).profileImage ?? "";
        token.bio = (user as any).bio ?? "";
        token.preferences = (user as any).preferences ?? {};
        token.recipes = Array.isArray((user as any).recipes) ? (user as any).recipes : [];
        token.shoppingLists = Array.isArray((user as any).shoppingLists) ? (user as any).shoppingLists : [];
        token.passwordHash = (user as any).passwordHash ?? "";
        token.referral = (user as any).referral ?? "";
        token.activeList = typeof (user as any).activeList === "string" ? (user as any).activeList : undefined;
        token.email = typeof user.email === "string" ? user.email : "";
        token.name = typeof user.name === "string" ? user.name : "";
        token.image = typeof user.image === "string" ? user.image : "";
      } else if (token.email || token.a_id) {
        // On subsequent requests, fetch latest user data from DB
        try {
          const users = await getUsersCollection();
          let dbUser = null;
          if (token.a_id) {
            dbUser = await users.findOne({ a_id: token.a_id });
          }
          if (!dbUser && token.email) {
            dbUser = await users.findOne({ email: token.email });
          }
          if (dbUser) {
            token._id = dbUser._id?.toString() ?? "";
            token.createdAt = dbUser.createdAt ?? "";
            token.username = dbUser.username ?? "";
            token.profileImage = dbUser.profileImage ?? "";
            token.bio = dbUser.bio ?? "";
            token.preferences = dbUser.preferences ?? {};
            token.recipes = Array.isArray(dbUser.recipes) ? dbUser.recipes : [];
            token.shoppingLists = Array.isArray(dbUser.shoppingLists) ? dbUser.shoppingLists : [];
            token.passwordHash = dbUser.passwordHash ?? "";
            token.referral = dbUser.referral ?? "";
            token.activeList = typeof dbUser.activeList === "string" ? dbUser.activeList : undefined;
            token.name = dbUser.username ?? "";
            token.image = dbUser.profileImage ?? "";
            token.a_id = dbUser.a_id ?? "";
          }
        } catch {
          // ignore DB errors, fallback to existing token
        }
      }
      token.email = token.email ?? "";
      token.name = token.name ?? "";
      token.image = token.image ?? "";
      token.activeList = token.activeList ?? undefined;
      return token;
    },
  },
};

export default NextAuth(nextAuthOptions);