export const REVIEW_TABLES = {
  REVIEWS: "reviews",
  BOOKINGS: "bookings",
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
export const MAX_COMMENT_LENGTH = 1000;

/** How many reviews a vendor page shows before "see all". */
export const REVIEW_PAGE_LIMIT = 20;

/**
 * Only a booking that reached this status earns the right to review.
 *
 * Reviews move a vendor's public rating, so the entitlement has to come from
 * something the vendor themselves confirmed — not merely from having an
 * account.
 */
export const REVIEWABLE_BOOKING_STATUS = "completed";

/** Unique index the upsert targets, added in 20260816090000. */
export const REVIEW_UNIQUE_CONSTRAINT = "user_id,target_type,target_id";

export const REVIEW_QUERY_KEYS = {
  all: ["reviews"] as const,
  byTarget: (targetType: string, targetId: string) =>
    [...REVIEW_QUERY_KEYS.all, targetType, targetId] as const,
  eligibility: (targetType: string, targetId: string) =>
    [...REVIEW_QUERY_KEYS.all, "eligibility", targetType, targetId] as const,
};
