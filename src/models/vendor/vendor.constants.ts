export const VENDOR_TABLES = {
  VENDORS: "vendors",
  BOOKINGS: "bookings",
  ORDER_ITEMS: "order_items",
} as const;

export const VENDOR_COLUMNS = {
  ID: "id",
  USER_ID: "user_id",
  STATUS: "status",
  VENDOR_ID: "vendor_id",
  SELLER_VENDOR_ID: "seller_vendor_id",
} as const;

/**
 * Column projections. Kept here rather than inline in the service so the two
 * places that read a vendor list cannot drift apart, and so a column rename is
 * a one-line change.
 */
export const VENDOR_SELECT = {
  FULL: "*",
  CARD: "id,business_name,category,city,state,address,latitude,longitude,service_mode,is_verified,rating,reviews_count,avatar_url,cover_url",
  ID_ONLY: "id",
} as const;

export const VENDOR_STATUSES = ["pending", "approved", "suspended"] as const;
export const VENDOR_CATEGORIES = ["barber", "hairdresser"] as const;
export const SERVICE_MODES = ["in_shop", "home", "both"] as const;

export const SERVICE_MODE_LABELS: Record<(typeof SERVICE_MODES)[number], string> = {
  in_shop: "In-shop only",
  home: "Home service only",
  both: "Both",
};

/** Discover pulls a single capped page — the map cannot usefully plot more. */
export const DISCOVER_VENDOR_LIMIT = 200;
export const PENDING_BOOKINGS_PREVIEW_LIMIT = 5;

export const DEFAULT_STATE_CODE = "LA";
export const DEFAULT_HOME_RADIUS_KM = 5;
export const DEFAULT_VENDOR_CATEGORY = "barber";
export const DEFAULT_SERVICE_MODE = "in_shop";

export const VENDOR_QUERY_KEYS = {
  all: ["vendors"] as const,
  lists: () => [...VENDOR_QUERY_KEYS.all, "list"] as const,
  approved: () => [...VENDOR_QUERY_KEYS.lists(), "approved"] as const,
  admin: () => [...VENDOR_QUERY_KEYS.lists(), "admin"] as const,
  detail: (id: string) => [...VENDOR_QUERY_KEYS.all, "detail", id] as const,
  me: () => [...VENDOR_QUERY_KEYS.all, "me"] as const,
  stats: (vendorId?: string) => [...VENDOR_QUERY_KEYS.all, "stats", vendorId ?? "none"] as const,
};
