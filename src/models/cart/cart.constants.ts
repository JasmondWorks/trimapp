/** Which storefront a cart line came from. */
export const CART_SOURCES = ["vendor", "shopify"] as const;

export const CART_SOURCE_LABELS: Record<(typeof CART_SOURCES)[number], string> = {
  vendor: "Vendor items",
  shopify: "TrimApp store",
};

/** Shopify can expire a cart server-side, so re-check when the tab wakes up. */
export const CART_SYNC_EVENT = "visibilitychange";
