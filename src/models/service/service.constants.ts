export const SERVICE_TABLES = {
  SERVICES: "services",
} as const;

export const SERVICE_COLUMNS = {
  ID: "id",
  VENDOR_ID: "vendor_id",
  IS_ACTIVE: "is_active",
} as const;

export const SERVICE_SELECT = {
  FULL: "*",
  PUBLIC: "id,name,price,duration_minutes,description,category",
} as const;

export const DEFAULT_SERVICE_DURATION_MINUTES = 30;
export const DEFAULT_SERVICE_CATEGORY = "general";

/** Durations offered in the vendor's "add service" form. */
export const SERVICE_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export const SERVICE_QUERY_KEYS = {
  all: ["services"] as const,
  byVendor: (vendorId: string) => [...SERVICE_QUERY_KEYS.all, "vendor", vendorId] as const,
  mine: () => [...SERVICE_QUERY_KEYS.all, "mine"] as const,
};
