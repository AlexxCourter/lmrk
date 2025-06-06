import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      username?: string;
      profileImage?: string;
      email?: string;
      name?: string;
      image?: string;
      [key: string]: any;
    };
  }
  interface User extends DefaultUser {
    username?: string;
    profileImage?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    profileImage?: string;
  }
}
