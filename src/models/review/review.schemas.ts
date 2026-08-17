import { z } from "zod";

import { MAX_RATING, MIN_RATING, REVIEW_TARGETS } from "./review.constants";

export const reviewTargetSchema = z.enum(REVIEW_TARGETS);

export const createReviewSchema = z.object({
  targetType: reviewTargetSchema,
  targetId: z.string().uuid(),
  rating: z.number().int().min(MIN_RATING, "Pick a rating").max(MAX_RATING),
  comment: z
    .string()
    .trim()
    .max(1000, "Keep it under 1000 characters")
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
});

export const listReviewsSchema = z.object({
  targetType: reviewTargetSchema,
  targetId: z.string().uuid(),
});
