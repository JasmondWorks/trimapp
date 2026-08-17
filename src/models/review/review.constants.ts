export const REVIEW_TABLES = {
  REVIEWS: "reviews",
} as const;

export const REVIEW_COLUMNS = {
  ID: "id",
  USER_ID: "user_id",
  TARGET_TYPE: "target_type",
  TARGET_ID: "target_id",
  CREATED_AT: "created_at",
} as const;

export const REVIEW_SELECT = {
  LIST: "id,rating,comment,created_at,user_id",
} as const;

export const REVIEW_TARGETS = ["vendor", "product", "booking"] as const;

export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** How many reviews a vendor page shows before "see all". */
export const REVIEW_PAGE_LIMIT = 20;

export const REVIEW_QUERY_KEYS = {
  all: ["reviews"] as const,
  byTarget: (targetType: string, targetId: string) =>
    [...REVIEW_QUERY_KEYS.all, targetType, targetId] as const,
};
