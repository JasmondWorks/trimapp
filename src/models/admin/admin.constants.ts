export const ADMIN_QUERY_KEYS = {
  all: ["admin"] as const,
  overview: () => [...ADMIN_QUERY_KEYS.all, "overview"] as const,
};

/** The overview refreshes on a slower cadence than user-facing data. */
export const ADMIN_OVERVIEW_STALE_TIME = 60 * 1000;
