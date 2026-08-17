export const PRODUCT_TABLES = {
  VENDOR_PRODUCTS: "vendor_products",
} as const;

export const PRODUCT_COLUMNS = {
  ID: "id",
  SLUG: "slug",
  VENDOR_ID: "vendor_id",
  IS_ACTIVE: "is_active",
  STOCK: "stock",
} as const;

export const PRODUCT_SELECT = {
  FULL: "*",
  CARD: "id,vendor_id,title,slug,description,category,price_naira,stock,images,vendors(business_name,commission_pct)",
  DETAIL: "*,vendors(id,business_name,commission_pct)",
} as const;

/** The shop grid pulls one capped page; search and filters run client-side. */
export const SHOP_PRODUCT_LIMIT = 60;
export const SHOPIFY_PRODUCT_LIMIT = 40;

/** The vendor "add product" vocabulary, and the shop's category filter. */
export const PRODUCT_CATEGORIES = [
  "wigs",
  "clippers",
  "trimmers",
  "combs",
  "capes",
  "kits",
] as const;

export const PRODUCT_CATEGORY_LABELS: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  wigs: "Wigs",
  clippers: "Clippers",
  trimmers: "Trimmers",
  combs: "Combs",
  capes: "Capes",
  kits: "Kits",
};

export const DEFAULT_PRODUCT_CATEGORY = "wigs";
export const DEFAULT_PRODUCT_STOCK = 10;

/** Random suffix length used to keep generated slugs unique. */
export const SLUG_SUFFIX_LENGTH = 4;

export const PRODUCT_SOURCES = ["vendor", "shopify"] as const;

export const PRODUCT_QUERY_KEYS = {
  all: ["products"] as const,
  shop: () => [...PRODUCT_QUERY_KEYS.all, "shop"] as const,
  detail: (slug: string) => [...PRODUCT_QUERY_KEYS.all, "detail", slug] as const,
  mine: () => [...PRODUCT_QUERY_KEYS.all, "mine"] as const,
};
