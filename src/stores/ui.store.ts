import { create } from "zustand";

/**
 * Cross-component UI state — the bits two unrelated components both need to
 * open or close. Anything only one component cares about stays in `useState`.
 */
interface UiState {
  isMobileNavOpen: boolean;
  isCartOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setCartOpen: (open: boolean) => void;
  closeAll: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isMobileNavOpen: false,
  isCartOpen: false,
  setMobileNavOpen: (isMobileNavOpen) => set({ isMobileNavOpen }),
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
  setCartOpen: (isCartOpen) => set({ isCartOpen }),
  closeAll: () => set({ isMobileNavOpen: false, isCartOpen: false }),
}));
