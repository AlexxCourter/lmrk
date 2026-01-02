"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients?: { id: string; name: string; quantity?: string; unit?: string }[];
  instructions?: string[];
  mealType?: "Breakfast" | "Lunch" | "Dinner" | "Dessert" | "Snack";
  tags?: string[];
  color?: string;
  [key: string]: unknown;
};

type ShoppingList = {
  _id: string;
  name: string;
  color?: string;
  items: { _id: string; name: string; checked?: boolean; quantity?: string | number }[];
};

type UserData = {
  recipes: Recipe[];
  shoppingLists: ShoppingList[];
  activeList?: string;
  groupInfo?: {
    groupEnabled?: boolean;
    groupId?: string;
    role?: "owner" | "member";
    familyName?: string;
    joinedAt?: string;
  } | null;
};

type UserDataContextType = {
  data: UserData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (status !== "authenticated" || !session?.user) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const fetchedData = await response.json();
      const userData: UserData = {
        recipes: fetchedData.recipes || [],
        shoppingLists: fetchedData.shoppingLists || [],
        activeList: fetchedData.activeList,
        groupInfo: fetchedData.groupInfo || null,
      };

      setData(userData);
      // Cache in sessionStorage
      sessionStorage.setItem("userData", JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load from sessionStorage on mount, then fetch fresh data
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setData(null);
      setLoading(false);
      sessionStorage.removeItem("userData");
      return;
    }

    // Try to load from cache first
    const cached = sessionStorage.getItem("userData");
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch {
        // Invalid cache, ignore
      }
    }

    // Fetch fresh data
    fetchData();
  }, [session, status]);

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <UserDataContext.Provider value={{ data, loading, error, refreshData }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
}
