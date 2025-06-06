import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUsersCollection } from "@/models/User";
import bcrypt from "bcryptjs";

// --- NextAuth Configuration ---
const nextAuthOptions = {
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
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;
        return {
          id: user._id?.toString(),
          _id: user._id?.toString(),
          createdAt: user.createdAt,
          email: user.email,
          username: user.username,
          profileImage: user.profileImage,
          bio: user.bio,
          preferences: user.preferences,
          recipes: user.recipes,
          shoppingLists: user.shoppingLists,
          passwordHash: user.passwordHash,
          referral: user.referral,
          activeList: typeof user.activeList === "string" ? user.activeList : null,
          name: user.username,
          image: user.profileImage,
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const users = await getUsersCollection();
        if (!user.email) throw new Error("Google account did not return an email.");
        const existing = await users.findOne({ email: user.email });
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
              notifications: true,
              language: "en",
            },
            passwordHash: "",
            referral: "",
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id;
        token.createdAt = user.createdAt;
        token.username = user.username;
        token.profileImage = user.profileImage;
        token.bio = user.bio;
        token.preferences = user.preferences;
        token.recipes = user.recipes;
        token.shoppingLists = user.shoppingLists;
        token.passwordHash = user.passwordHash;
        token.referral = user.referral;
        token.activeList = user.activeList ?? null;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user._id = token._id as string | undefined;
        session.user.createdAt = token.createdAt as string | undefined;
        session.user.username = token.username as string | undefined;
        session.user.profileImage = token.profileImage as string | undefined;
        session.user.bio = token.bio as string | undefined;
        session.user.preferences = token.preferences as Record<string, unknown> | undefined;
        session.user.recipes = token.recipes as Record<string, unknown>[] | undefined;
        session.user.shoppingLists = token.shoppingLists as Record<string, unknown>[] | undefined;
        session.user.passwordHash = token.passwordHash as string | undefined;
        session.user.referral = token.referral as string | undefined;
        session.user.activeList = token.activeList as string | null | undefined;
        session.user.email = token.email as string | undefined;
        session.user.name = token.name as string | undefined;
        session.user.image = token.image as string | undefined;
      }
      return session;
    },
  },
};
export default NextAuth(nextAuthOptions);