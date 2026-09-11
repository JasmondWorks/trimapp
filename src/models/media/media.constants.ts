export const MEDIA_BUCKET = "media";

/** First path segment — names the entity that owns the file. */
export const MEDIA_SCOPES = ["profiles", "vendors"] as const;

/** Mirrors the bucket's own limits, so we can reject early with a clear message. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

/** For the file input's `accept` attribute. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

export const MEDIA_QUERY_KEYS = {
  all: ["media"] as const,
};
