export const ORDER_TABLES = {
  ORDERS: "orders",
  ORDER_ITEMS: "order_items",
} as const;

export const ORDER_COLUMNS = {
  ID: "id",
  USER_ID: "user_id",
  ORDER_ID: "order_id",
  SELLER_VENDOR_ID: "seller_vendor_id",
  CREATED_AT: "created_at",
} as const;

export const ORDER_SELECT = {
  MINE: "id,status,total_naira,created_at,order_items(id,title,quantity,unit_price,source,seller_vendor_id,fulfillment_status,vendors(business_name))",
  ADMIN: "id,status,total_naira,created_at,delivery_name,delivery_city,delivery_state,user_id",
  VENDOR_ITEMS:
    "id,title,quantity,unit_price,fulfillment_status,created_at,orders(delivery_name,delivery_city,delivery_state)",
  TOTALS: "id,total_naira,status",
} as const;

export const ORDER_STATUSES = [
  "pending",
  "awaiting_payment",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const FULFILLMENT_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

/**
 * Where a vendor may move an order item next. Terminal states have no
 * transitions, which is what hides the "Move to…" control in the UI.
 */
export const FULFILLMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/** Payments are not wired up yet — new orders park here. */
export const INITIAL_ORDER_STATUS = "awaiting_payment";

export const PERCENT_DIVISOR = 100;

export const ORDER_QUERY_KEYS = {
  all: ["orders"] as const,
  mine: () => [...ORDER_QUERY_KEYS.all, "mine"] as const,
  admin: () => [...ORDER_QUERY_KEYS.all, "admin"] as const,
  vendorItems: () => [...ORDER_QUERY_KEYS.all, "vendor-items"] as const,
};
