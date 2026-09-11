import type { MEDIA_SCOPES } from "./media.constants";

export type MediaScope = (typeof MEDIA_SCOPES)[number];

export interface UploadedImage {
  /** Object path inside the bucket, needed to delete it later. */
  path: string;
  /** Public URL to store on the owning row and render from. */
  url: string;
}
