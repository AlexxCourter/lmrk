declare module "next-auth" {
  interface Session {
    user?: {
      username?: string;
      profileImage?: string;
      email?: string;
      name?: string;
      image?: string;
      [key: string]: unknown;
    };
  }
  interface User {
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
