import { z } from "zod";

import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, MEDIA_SCOPES } from "./media.constants";

export const mediaScopeSchema = z.enum(MEDIA_SCOPES);

/**
 * Validates the file itself.
 *
 * The bucket enforces type and size too, but failing here gives the user a
 * sentence they can act on instead of a storage error code.
 */
export const uploadSchema = z.object({
  scope: mediaScopeSchema,
  /** Owning id: a user id for profiles, a vendor id for vendors. */
  ownerId: z.string().uuid(),
  file: z
    .instanceof(File, { message: "Choose an image to upload" })
    .refine((f) => f.size > 0, "That file is empty")
    .refine((f) => f.size <= MAX_UPLOAD_BYTES, "Images must be 5MB or smaller")
    .refine(
      (f) => (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type),
      "Use a JPEG, PNG, WebP, GIF or AVIF image",
    ),
});

export const deleteMediaSchema = z.object({
  path: z.string().min(1),
});
