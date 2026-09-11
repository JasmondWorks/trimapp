"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";
import { VENDOR_QUERY_KEYS } from "@/models/vendor/vendor.constants";

import { REVIEW_QUERY_KEYS } from "./review.constants";
import { createReview, getReviewEligibility, listReviews } from "./review.services";
import type { CreateReviewInput, ReviewTarget } from "./review.types";

export function useReviews(targetType: ReviewTarget, targetId: string | undefined) {
  const query = useQuery({
    queryKey: REVIEW_QUERY_KEYS.byTarget(targetType, targetId ?? ""),
    queryFn: () => unwrap(listReviews({ targetType, targetId })),
    enabled: !!targetId,
  });

  return { reviews: query.data ?? emptyList(), isLoading: query.isPending };
}

/** Whether to show the review form, and the caller's existing review if any. */
export function useReviewEligibility(targetType: ReviewTarget, targetId: string | undefined) {
  const query = useQuery({
    queryKey: REVIEW_QUERY_KEYS.eligibility(targetType, targetId ?? ""),
    queryFn: () => unwrap(getReviewEligibility({ targetType, targetId })),
    enabled: !!targetId,
  });

  return {
    canReview: query.data?.canReview ?? false,
    reason: query.data?.reason ?? null,
    existing: query.data?.existing ?? null,
    isLoading: query.isPending,
  };
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateReviewInput) => unwrap(createReview(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEYS.all });
      // The trigger just moved the vendor's rating and review count.
      queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all });
    },
  });

  return { createReview: mutation.mutateAsync, isPosting: mutation.isPending };
}
