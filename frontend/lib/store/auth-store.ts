"use client";

import type { User } from "@/lib/types/auth.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateTokens: (token: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setSessionExpired: (state: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isSessionExpired: false,
      hasHydrated: false,

      setAuth: (user, token, refreshToken) => {
        set({ user, token, refreshToken, isAuthenticated: true, isSessionExpired: false });
        if (typeof document !== "undefined") {
          document.cookie = `rt_auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `rt_auth_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
        }
      },

      updateTokens: (token, refreshToken) => {
        set({ token, refreshToken });
        if (typeof document !== "undefined") {
          document.cookie = `rt_auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
      },

      clearAuth: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isSessionExpired: false });
        if (typeof document !== "undefined") {
          document.cookie = "rt_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "rt_auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      },

      updateUser: (updatedUser) =>
        set((state) => {
          const newUser = state.user ? { ...state.user, ...updatedUser } : null;
          if (newUser && typeof document !== "undefined") {
            document.cookie = `rt_auth_role=${newUser.role}; path=/; max-age=604800; SameSite=Lax`;
          }
          return { user: newUser };
        }),

      setSessionExpired: (state) => set({ isSessionExpired: state }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "rt-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => () => {
        state.setHasHydrated(true);
        if (typeof document !== "undefined" && state.token) {
          document.cookie = `rt_auth_token=${state.token}; path=/; max-age=604800; SameSite=Lax`;
          if (state.user) {
            document.cookie = `rt_auth_role=${state.user.role}; path=/; max-age=604800; SameSite=Lax`;
          }
        }
      },
    }
  )
);
