"use client";

import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_COMMENT_LENGTH, MAX_RATING, MIN_RATING } from "@/models/review/review.constants";
import { useCreateReview, useReviewEligibility } from "@/models/review/review.hooks";
import type { ReviewTarget } from "@/models/review/review.types";

/**
 * Write or edit a review.
 *
 * Renders nothing unless the viewer is entitled — for vendors that means a
 * booking the vendor marked completed. Submitting again edits the existing
 * review rather than adding a second one.
 */
export function ReviewForm({
  targetType,
  targetId,
}: {
  targetType: ReviewTarget;
  targetId: string;
}) {
  const { canReview, reason, existing, isLoading } = useReviewEligibility(targetType, targetId);
  const { createReview, isPosting } = useCreateReview();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  // Seed from the existing review once it arrives. Adjusting state during
  // render rather than in an effect avoids a flash of the empty form.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (existing && seededFor !== existing.id) {
    setSeededFor(existing.id);
    setRating(existing.rating);
    setComment(existing.comment ?? "");
  }

  if (isLoading) return null;

  if (!canReview) {
    // Silent for signed-out visitors — a sign-in prompt on every vendor page
    // would be noise. Someone who booked but hasn't been marked complete gets
    // an explanation, because they may well be looking for the form.
    if (reason === "no-completed-booking") {
      return (
        <p className="text-sm text-muted-foreground">
          You can leave a review once this vendor completes a booking for you.
        </p>
      );
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < MIN_RATING) return toast.error("Pick a rating first");
    try {
      await createReview({ targetType, targetId, rating, comment });
      toast.success(existing ? "Review updated" : "Thanks for the review");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const shown = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4">
      <p className="font-medium">{existing ? "Edit your review" : "Leave a review"}</p>

      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            aria-pressed={rating === value}
            onMouseEnter={() => setHovered(value)}
            onClick={() => setRating(value)}
            className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                value <= shown ? "fill-primary text-primary" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        rows={3}
        className="mt-3"
        placeholder="How was it? (optional)"
        maxLength={MAX_COMMENT_LENGTH}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button
        type="submit"
        disabled={isPosting}
        className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isPosting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : existing ? (
          "Update review"
        ) : (
          "Post review"
        )}
      </Button>
    </form>
  );
}
