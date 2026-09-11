export const ADMIN_TABLES = {
  PROFILES: "profiles",
  USER_ROLES: "user_roles",
} as const;

export const ADMIN_QUERY_KEYS = {
  all: ["admin"] as const,
  overview: () => [...ADMIN_QUERY_KEYS.all, "overview"] as const,
  users: () => [...ADMIN_QUERY_KEYS.all, "users"] as const,
};

/** The overview refreshes on a slower cadence than user-facing data. */
export const ADMIN_OVERVIEW_STALE_TIME = 60 * 1000;

/** Roles an admin can hand out from the users screen. */
export const ASSIGNABLE_ROLES = ["customer", "vendor", "admin"] as const;

/** Users are listed newest-first, one capped page. */
export const ADMIN_USER_LIMIT = 200;
