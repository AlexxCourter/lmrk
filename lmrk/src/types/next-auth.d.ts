declare module "next-auth" {
  interface Session {
    user?: {
      _id?: string;
      createdAt?: string;
      username?: string;
      email?: string;
      profileImage?: string;
      bio?: string;
      preferences?: {
        theme?: string;
        notifications?: boolean;
        language?: string;
      };
      shoppingLists?: Record<string, unknown>[];
      recipes?: Record<string, unknown>[];
      passwordHash?: string;
      referral?: string;
      activeList?: string | null;
      name?: string;
      image?: string;
      [key: string]: unknown;
    };
  }
  interface User {
    _id?: string;
    createdAt?: string;
    username?: string;
    email?: string;
    profileImage?: string;
    bio?: string;
    preferences?: {
      theme?: string;
      notifications?: boolean;
      language?: string;
    };
    shoppingLists?: Record<string, unknown>[];
    recipes?: Record<string, unknown>[];
    passwordHash?: string;
    referral?: string;
    activeList?: string | null;
    name?: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    createdAt?: string;
    username?: string;
    email?: string;
    profileImage?: string;
    bio?: string;
    preferences?: {
      theme?: string;
      notifications?: boolean;
      language?: string;
    };
    shoppingLists?: Record<string, unknown>[];
    recipes?: Record<string, unknown>[];
    passwordHash?: string;
    referral?: string;
    activeList?: string | null;
    name?: string;
    image?: string;
    [key: string]: unknown;
  }
}
