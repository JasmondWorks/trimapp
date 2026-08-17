export const PROFILE_TABLES = {
  PROFILES: "profiles",
} as const;

export const PROFILE_COLUMNS = {
  ID: "id",
} as const;

export const PROFILE_SELECT = {
  FULL: "*",
} as const;

export const PROFILE_QUERY_KEYS = {
  all: ["profiles"] as const,
  me: () => [...PROFILE_QUERY_KEYS.all, "me"] as const,
};
