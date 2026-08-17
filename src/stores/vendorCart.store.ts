"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { VENDOR_CART_STORAGE_KEY } from "./cart.constants";

/**
 * Vendor-product cart.
 *
 * Purely local — vendor items have no remote cart, so this is the source of
 * truth until checkout. Prices held here are for display only: the checkout
 * action re-reads every price from the database, so a tampered cart cannot
 * change what the customer is charged.
 */
export interface VendorCartItem {
  productId: string;
  vendorId: string;
  vendorName: string;
  title: string;
  imageUrl: string | null;
  /** Naira. */
  unitPrice: number;
  quantity: number;
  commissionPct: number;
}

interface VendorCartStore {
  items: VendorCartItem[];
  addItem: (item: Omit<VendorCartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalNaira: () => number;
}

export const useVendorCart = create<VendorCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: item.quantity ?? 1 }] };
        }),
      updateQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((n, i) => n + i.quantity, 0),
      totalNaira: () => get().items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
    }),
    {
      name: VENDOR_CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * The lines the checkout action accepts — ids and quantities only.
 *
 * A plain mapper, deliberately *not* a zustand selector: it builds a new array
 * each call, and zustand v5 passes selectors straight to useSyncExternalStore,
 * where an unstable snapshot causes an infinite render loop. Call it inside a
 * `useMemo` over `items` instead.
 */
export const toCheckoutLines = (items: VendorCartItem[]) =>
  items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
