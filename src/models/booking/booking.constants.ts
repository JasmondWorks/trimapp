export const BOOKING_TABLES = {
  BOOKINGS: "bookings",
} as const;

export const BOOKING_COLUMNS = {
  ID: "id",
  USER_ID: "user_id",
  VENDOR_ID: "vendor_id",
  STATUS: "status",
  SCHEDULED_AT: "scheduled_at",
} as const;

export const BOOKING_SELECT = {
  /** Customer's own bookings list. */
  MINE: "id,scheduled_at,status,notes,mode,address,total_amount,payment_status,vendor_id,service_id,vendors(business_name),services(name,duration_minutes)",
  /** Vendor's incoming queue. */
  VENDOR: "id,scheduled_at,status,mode,address,notes,total_amount,services(name)",
  /** Admin overview. */
  ADMIN: "id,scheduled_at,status,total_amount,vendors(business_name),services(name)",
} as const;

/** `bookings.status` is free text in the schema — this is the app's vocabulary. */
export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;

/** Which statuses a vendor may move a booking to from its current one. */
export const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const BOOKING_MODES = ["in_shop", "home"] as const;

export const DEFAULT_BOOKING_TIME = "10:00";

export const BOOKING_QUERY_KEYS = {
  all: ["bookings"] as const,
  mine: () => [...BOOKING_QUERY_KEYS.all, "mine"] as const,
  vendor: () => [...BOOKING_QUERY_KEYS.all, "vendor"] as const,
  admin: () => [...BOOKING_QUERY_KEYS.all, "admin"] as const,
};
