import { z } from "zod";

import { MAX_COMMENT_LENGTH, MAX_RATING, MIN_RATING, REVIEW_TARGETS } from "./review.constants";

export const reviewTargetSchema = z.enum(REVIEW_TARGETS);

export const createReviewSchema = z.object({
  targetType: reviewTargetSchema,
  targetId: z.string().uuid(),
  rating: z.coerce
    .number()
    .int()
    .min(MIN_RATING, "Pick a rating")
    .max(MAX_RATING, `Ratings go up to ${MAX_RATING}`),
  comment: z
    .string()
    .trim()
    .max(MAX_COMMENT_LENGTH, `Keep it under ${MAX_COMMENT_LENGTH} characters`)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
});

export const listReviewsSchema = z.object({
  targetType: reviewTargetSchema,
  targetId: z.string().uuid(),
});

export const reviewTargetRefSchema = listReviewsSchema;
