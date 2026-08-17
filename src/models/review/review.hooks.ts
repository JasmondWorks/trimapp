"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";

import { REVIEW_QUERY_KEYS } from "./review.constants";
import { createReview, listReviews } from "./review.services";
import type { CreateReviewInput, ReviewTarget } from "./review.types";

export function useReviews(targetType: ReviewTarget, targetId: string | undefined) {
  const query = useQuery({
    queryKey: REVIEW_QUERY_KEYS.byTarget(targetType, targetId ?? ""),
    queryFn: () => unwrap(listReviews({ targetType, targetId })),
    enabled: !!targetId,
  });

  return { reviews: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateReviewInput) => unwrap(createReview(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEYS.all }),
  });

  return { createReview: mutation.mutateAsync, isPosting: mutation.isPending };
}
