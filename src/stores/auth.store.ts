import { create } from "zustand";

import type { AuthUser, Role } from "@/models/auth/auth.types";

/**
 * Auth state that components read synchronously.
 *
 * Deliberately holds no tokens — the access token lives in
 * `lib/token-manager.ts` (outside React, so a re-render can never leak it into
 * a devtools snapshot) and the refresh token is httpOnly. This store is the
 * *identity*, mirrored from the `useCurrentUser` query by `useAuthBootstrap`.
 */
interface AuthState {
  user: AuthUser | null;
  roles: Role[];
  /** False until the first session restore settles. */
  isReady: boolean;
  setUser: (user: AuthUser | null) => void;
  setRoles: (roles: Role[]) => void;
  setReady: (ready: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  roles: [],
  isReady: false,
  setUser: (user) => set({ user }),
  setRoles: (roles) => set({ roles }),
  setReady: (isReady) => set({ isReady }),
  reset: () => set({ user: null, roles: [], isReady: true }),
}));

export const selectIsAdmin = (s: AuthState) => s.roles.includes("admin");
export const selectIsVendor = (s: AuthState) => s.roles.includes("vendor");
export const selectIsAuthenticated = (s: AuthState) => s.user !== null;
