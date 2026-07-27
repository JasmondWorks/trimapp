import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface VendorCartItem {
  productId: string;
  vendorId: string;
  vendorName: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number; // Naira
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
      name: "trimapp-vendor-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
