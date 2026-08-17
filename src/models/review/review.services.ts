"use server";

import { getPublicClient, requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse } from "@/lib/api";

import {
  REVIEW_COLUMNS,
  REVIEW_PAGE_LIMIT,
  REVIEW_SELECT,
  REVIEW_TABLES,
} from "./review.constants";
import { createReviewSchema, listReviewsSchema } from "./review.schemas";
import type { Review, ReviewListItem } from "./review.types";

/** Public: the most recent reviews for a vendor, product or booking. */
export async function listReviews(input: unknown): Promise<ApiResponse<ReviewListItem[]>> {
  const parsed = listReviewsSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid review target");

  try {
    const { data, error } = await getPublicClient()
      .from(REVIEW_TABLES.REVIEWS)
      .select(REVIEW_SELECT.LIST)
      .eq(REVIEW_COLUMNS.TARGET_TYPE, parsed.data.targetType)
      .eq(REVIEW_COLUMNS.TARGET_ID, parsed.data.targetId)
      .order(REVIEW_COLUMNS.CREATED_AT, { ascending: false })
      .limit(REVIEW_PAGE_LIMIT);
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return failFrom(error, "Could not load reviews");
  }
}

export async function createReview(input: unknown): Promise<ApiResponse<Review>> {
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check your review and try again");

  try {
    const { client, userId } = await requireServerSession();
    const { targetType, targetId, rating, comment } = parsed.data;
    const { data, error } = await client
      .from(REVIEW_TABLES.REVIEWS)
      .insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        rating,
        comment: comment ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok(data, "Thanks for the review");
  } catch (error) {
    return failFrom(error, "Could not post your review");
  }
}
