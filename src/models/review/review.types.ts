import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { createReviewSchema } from "./review.schemas";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewTarget = Database["public"]["Enums"]["review_target"];

/** `REVIEW_SELECT.LIST` — what a vendor page renders. */
export type ReviewListItem = Pick<Review, "id" | "rating" | "comment" | "created_at" | "user_id">;

/** Why the review form is hidden, when it is. */
export type ReviewDenialReason = "signed-out" | "no-completed-booking";

export interface ReviewEligibility {
  canReview: boolean;
  reason: ReviewDenialReason | null;
  /** The caller's existing review, so the form can open pre-filled. */
  existing: ReviewListItem | null;
}

export type CreateReviewInput = z.input<typeof createReviewSchema>;
