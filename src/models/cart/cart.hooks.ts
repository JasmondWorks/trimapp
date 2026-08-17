"use client";

import { useEffect } from "react";

import { useCartStore } from "@/stores/shopifyCart.store";
import { useVendorCart } from "@/stores/vendorCart.store";

import { CART_SYNC_EVENT } from "./cart.constants";
import type { CartSummary } from "./cart.types";

/**
 * Keeps the local Shopify cart honest.
 *
 * Shopify can expire or empty a cart on its side, which would otherwise leave
 * a stale badge in the header forever. Re-check on mount and whenever the tab
 * becomes visible again.
 */
export function useCartSync() {
  const syncCart = useCartStore((s) => s.syncCart);

  useEffect(() => {
    syncCart();
    const handler = () => {
      if (document.visibilityState === "visible") syncCart();
    };
    document.addEventListener(CART_SYNC_EVENT, handler);
    return () => document.removeEventListener(CART_SYNC_EVENT, handler);
  }, [syncCart]);
}

/** Both carts as one summary, for the header badge and checkout guards. */
export function useCartSummary(): CartSummary {
  const vendorItems = useVendorCart((s) => s.items);
  const shopifyItems = useCartStore((s) => s.items);

  const vendorItemCount = vendorItems.reduce((n, i) => n + i.quantity, 0);
  const shopifyItemCount = shopifyItems.reduce((n, i) => n + i.quantity, 0);
  const vendorTotalNaira = vendorItems.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

  return {
    vendorItemCount,
    shopifyItemCount,
    totalItemCount: vendorItemCount + shopifyItemCount,
    vendorTotalNaira,
    isEmpty: vendorItemCount + shopifyItemCount === 0,
  };
}
