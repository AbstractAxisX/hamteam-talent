"use client";

import { create } from "zustand";
import { api } from "./api-client";
import type { SafeUser } from "./types";
import { navigate } from "./nav";

interface UserState {
  user: SafeUser | null;
  loading: boolean;
  fetched: boolean;
  fetchUser: () => Promise<void>;
  setUser: (u: SafeUser | null) => void;
}

export const useUser = create<UserState>((set) => ({
  user: null,
  loading: true,
  fetched: false,
  fetchUser: async () => {
    try {
      const data = await api<{ user: SafeUser | null }>("/api/auth/me");
      set({ user: data.user, loading: false, fetched: true });
      // Redirect to onboarding if logged in but no username
      if (data.user && !data.user.username && typeof window !== "undefined") {
        const hash = window.location.hash;
        if (!hash.includes("onboarding") && !hash.includes("admin")) {
          navigate({ view: "onboarding" });
        }
      }
    } catch {
      set({ user: null, loading: false, fetched: true });
    }
  },
  setUser: (u) => set({ user: u, loading: false, fetched: true }),
}));

export function useIsAdmin() {
  return useUser((s) => s.user?.role === "admin");
}
