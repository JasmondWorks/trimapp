"use server";

import { requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";
import { resolveMyVendorId } from "@/models/vendor/vendor.server";

import { MEDIA_BUCKET } from "./media.constants";
import { deleteMediaSchema, uploadSchema } from "./media.schemas";
import type { UploadedImage } from "./media.types";

/**
 * Image uploads.
 *
 * The bytes go through the server rather than straight to Supabase, because
 * the browser deliberately has no Supabase client — the same reason every
 * other read and write is a server action. Storage RLS still applies: the
 * upload runs with the caller's JWT, so the path policies decide what lands.
 *
 * Note the extra ownership check below. Storage policies already prevent
 * writing into another shop's folder, but failing here produces an
 * explainable error instead of an opaque storage rejection.
 */

/** Random, collision-resistant, and keeps the original extension for content-type sniffing. */
function buildObjectName(file: File): string {
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "jpg";
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg";
  return `${crypto.randomUUID()}.${safeExt}`;
}

export async function uploadImage(formData: FormData): Promise<ApiResponse<UploadedImage>> {
  const parsed = uploadSchema.safeParse({
    scope: formData.get("scope"),
    ownerId: formData.get("ownerId"),
    file: formData.get("file"),
  });
  if (!parsed.success) return failFrom(parsed.error.issues[0], "That file could not be uploaded");

  try {
    const { client, userId } = await requireServerSession();
    const { scope, ownerId, file } = parsed.data;

    if (scope === "profiles" && ownerId !== userId) {
      return failFrom(null, "You can only change your own picture");
    }
    if (scope === "vendors") {
      const myVendorId = await resolveMyVendorId(client, userId);
      if (myVendorId !== ownerId) return failFrom(null, "That isn't your shop");
    }

    const path = `${scope}/${ownerId}/${buildObjectName(file)}`;
    const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, file, {
      contentType: file.type,
      // Names are random, so a collision means something is wrong — don't mask it.
      upsert: false,
    });
    if (error) throw error;

    const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return ok({ path, url: data.publicUrl }, "Image uploaded");
  } catch (error) {
    return failFrom(error, "Could not upload that image");
  }
}

/**
 * Removes a previously uploaded object.
 *
 * Best-effort by design: the caller has usually already detached the image from
 * its row, and leaving an orphaned object is far less harmful than failing the
 * user's save. Storage RLS still decides whether the delete is permitted.
 */
export async function deleteImage(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = deleteMediaSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid image");

  try {
    const { client } = await requireServerSession();
    const { error } = await client.storage.from(MEDIA_BUCKET).remove([parsed.data.path]);
    if (error) throw error;
    return ok({ message: "Image removed" });
  } catch (error) {
    return failFrom(error, "Could not remove that image");
  }
}
