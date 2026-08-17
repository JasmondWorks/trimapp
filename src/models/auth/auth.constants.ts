/** Supabase tables owned by the auth domain. */
export const AUTH_TABLES = {
  USER_ROLES: "user_roles",
} as const;

export const AUTH_COLUMNS = {
  USER_ID: "user_id",
  ROLE: "role",
} as const;

/** Column list for a roles lookup. */
export const ROLE_SELECT = "role";

export const ROLES = ["customer", "vendor", "admin"] as const;

export const AUTH_QUERY_KEYS = {
  all: ["auth"] as const,
  session: () => [...AUTH_QUERY_KEYS.all, "session"] as const,
  currentUser: () => [...AUTH_QUERY_KEYS.all, "current-user"] as const,
  roles: () => [...AUTH_QUERY_KEYS.all, "roles"] as const,
};

/** Where each role lands after signing in. */
export const POST_AUTH_REDIRECT = "/discover";
export const SIGN_IN_ROUTE = "/auth";
export const AUTH_CALLBACK_ROUTE = "/auth/callback";
export const PASSWORD_RESET_ROUTE = "/auth/reset-password";

/** How long the current-user query stays fresh, in ms. */
export const SESSION_STALE_TIME = 5 * 60 * 1000;

export const PASSWORD_MIN_LENGTH = 8;
