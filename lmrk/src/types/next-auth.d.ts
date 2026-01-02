declare module "next-auth" {
  interface Session {
    user?: {
      _id?: string;
      createdAt?: string;
      username?: string;
      email?: string | null | undefined;
      profileImage?: string;
      bio?: string;
      preferences?: {
        theme?: string;
        notifications?: boolean;
        language?: string;
      };
      passwordHash?: string;
      referral?: string;
      activeList?: string | null;
      groupInfo?: {
        groupId?: string;
        groupEnabled?: boolean;
        role?: "owner" | "member";
        familyName?: string;
        joinedAt?: string;
      } | null;
      name?: string | null | undefined;
      image?: string | null | undefined;
  role?: string;
  [key: string]: unknown;
    };
  }
  interface User {
    _id?: string;
    createdAt?: string;
    username?: string;
    email?: string | null | undefined;
    profileImage?: string;
    bio?: string;
    preferences?: {
      theme?: string;
      notifications?: boolean;
      language?: string;
    };
    referral?: string;
    activeList?: string | null;
  name?: string | null | undefined;
  image?: string | null | undefined;
  role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    createdAt?: string;
    username?: string;
    email?: string | null | undefined;
    profileImage?: string;
    bio?: string;
    preferences?: {
      theme?: string;
      notifications?: boolean;
      language?: string;
    };
    referral?: string;
    activeList?: string | null;
    groupInfo?: {
      groupId?: string;
      groupEnabled?: boolean;
      role?: "owner" | "member";
      familyName?: string;
      joinedAt?: string;
    } | null;
    groupInfo?: {
      groupId?: string;
      groupEnabled?: boolean;
      role?: "owner" | "member";
      familyName?: string;
      joinedAt?: string;
    } | null;
    name?: string | null | undefined;
    image?: string | null | undefined;
    a_id?: string;
    [key: string]: unknown;
  }
}
