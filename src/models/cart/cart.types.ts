import type { CART_SOURCES } from "./cart.constants";

export type CartSource = (typeof CART_SOURCES)[number];

/** The combined view of both carts that the header and drawer render. */
export interface CartSummary {
  vendorItemCount: number;
  shopifyItemCount: number;
  totalItemCount: number;
  /** Naira total for vendor items only — Shopify prices carry their own currency. */
  vendorTotalNaira: number;
  isEmpty: boolean;
}
