"use server";

import { getPublicClient, getServerSession, requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse } from "@/lib/api";
import { BOOKING_COLUMNS } from "@/models/booking/booking.constants";

import {
  REVIEW_COLUMNS,
  REVIEW_PAGE_LIMIT,
  REVIEW_SELECT,
  REVIEW_TABLES,
  REVIEW_UNIQUE_CONSTRAINT,
  REVIEWABLE_BOOKING_STATUS,
} from "./review.constants";
import { createReviewSchema, listReviewsSchema, reviewTargetRefSchema } from "./review.schemas";
import type { Review, ReviewEligibility, ReviewListItem } from "./review.types";

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

/**
 * Whether the caller may review this vendor, and what they said last time.
 *
 * The same rule is enforced again in `createReview` — this exists so the UI can
 * show the form (or an explanation) without waiting for a rejected submit.
 */
export async function getReviewEligibility(input: unknown): Promise<ApiResponse<ReviewEligibility>> {
  const parsed = reviewTargetRefSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid review target");

  const denied = (reason: ReviewEligibility["reason"]): ReviewEligibility => ({
    canReview: false,
    reason,
    existing: null,
  });

  try {
    const session = await getServerSession();
    if (!session) return ok(denied("signed-out"));

    const { client, session: s } = session;
    const { targetType, targetId } = parsed.data;

    // Only vendors are gated on a completed booking; other targets are open.
    if (targetType === "vendor") {
      const { count, error } = await client
        .from(REVIEW_TABLES.BOOKINGS)
        .select("id", { count: "exact", head: true })
        .eq(BOOKING_COLUMNS.USER_ID, s.user.id)
        .eq(BOOKING_COLUMNS.VENDOR_ID, targetId)
        .eq(BOOKING_COLUMNS.STATUS, REVIEWABLE_BOOKING_STATUS);
      if (error) throw error;
      if (!count) return ok(denied("no-completed-booking"));
    }

    const { data: existing, error: existingError } = await client
      .from(REVIEW_TABLES.REVIEWS)
      .select(REVIEW_SELECT.LIST)
      .eq(REVIEW_COLUMNS.USER_ID, s.user.id)
      .eq(REVIEW_COLUMNS.TARGET_TYPE, targetType)
      .eq(REVIEW_COLUMNS.TARGET_ID, targetId)
      .maybeSingle();
    if (existingError) throw existingError;

    return ok({ canReview: true, reason: null, existing: existing ?? null });
  } catch (error) {
    return failFrom(error, "Could not check your review status");
  }
}

/**
 * Creates or replaces the caller's review.
 *
 * Upserts on the one-per-user-per-target index, so submitting again edits the
 * previous review rather than stacking duplicates and skewing the average.
 * `vendors.rating` and `reviews_count` are recomputed by a database trigger,
 * not here — doing it in application code would drift the moment a review is
 * deleted or edited outside this action.
 */
export async function createReview(input: unknown): Promise<ApiResponse<Review>> {
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check your review and try again");

  try {
    const { client, userId } = await requireServerSession();
    const { targetType, targetId, rating, comment } = parsed.data;

    // Re-check entitlement server-side: the UI gate is a convenience, not a
    // control, and this action is callable directly.
    if (targetType === "vendor") {
      const { count, error: bookingError } = await client
        .from(REVIEW_TABLES.BOOKINGS)
        .select("id", { count: "exact", head: true })
        .eq(BOOKING_COLUMNS.USER_ID, userId)
        .eq(BOOKING_COLUMNS.VENDOR_ID, targetId)
        .eq(BOOKING_COLUMNS.STATUS, REVIEWABLE_BOOKING_STATUS);
      if (bookingError) throw bookingError;
      if (!count) {
        return failFrom(null, "You can review a vendor once they've completed a booking for you");
      }
    }

    const { data, error } = await client
      .from(REVIEW_TABLES.REVIEWS)
      .upsert(
        {
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
          rating,
          comment: comment ?? null,
        },
        { onConflict: REVIEW_UNIQUE_CONSTRAINT },
      )
      .select("*")
      .single();
    if (error) throw error;
    return ok(data, "Thanks for the review");
  } catch (error) {
    return failFrom(error, "Could not post your review");
  }
}
