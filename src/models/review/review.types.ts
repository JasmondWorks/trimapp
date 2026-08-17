import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { createReviewSchema } from "./review.schemas";

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewTarget = Database["public"]["Enums"]["review_target"];

/** `REVIEW_SELECT.LIST` — what a vendor page renders. */
export type ReviewListItem = Pick<Review, "id" | "rating" | "comment" | "created_at" | "user_id">;

export type CreateReviewInput = z.input<typeof createReviewSchema>;
