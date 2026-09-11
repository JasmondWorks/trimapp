/**
 * localStorage keys for the two carts.
 *
 * Both are namespaced and versioned by name — changing a key is how you
 * deliberately orphan carts whose persisted shape no longer parses.
 */
export const VENDOR_CART_STORAGE_KEY = "trimapp-vendor-cart";
export const SHOPIFY_CART_STORAGE_KEY = "shopify-cart";

/** Cached geolocation for /discover — a convenience, never a credential. */
export const GEO_CACHE_KEY = "trimapp:coords";
