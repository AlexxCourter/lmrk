
import { ObjectId } from "mongodb";
import type { Recipe, ShoppingList } from "./User";

export interface PendingInvite {
  email: string;
  inviteToken: string;
  invitedAt: Date;
  invitedBy: string; // User ID of the person who sent the invite
}

export interface Group {
  _id?: ObjectId;
  groupId: string; // Unique group identifier
  name: string; // Family/group name
  ownerId: string; // User ID of group owner
  memberIds: string[]; // User IDs of all members
  pendingInvites: PendingInvite[]; // Pending invitations
  cookBook: Recipe[]; // Family recipes (structure can be expanded later)
  shoppingLists: ShoppingList[]; // Shared shopping lists (same as user shopping lists)
  createdAt: Date;
}

// Note: Recipe and ShoppingList types should be imported from the same place as User model for consistency.
