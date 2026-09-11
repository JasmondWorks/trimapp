"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE } from "@/models/media/media.constants";
import { useUploadImage } from "@/models/media/media.hooks";
import type { MediaScope } from "@/models/media/media.types";

/**
 * Picks an image, uploads it, and hands back the public URL.
 *
 * Controlled: the parent owns the value and decides when it is persisted, so
 * this never writes to a row itself. That keeps it usable for a vendor avatar,
 * a cover photo and product shots without knowing anything about them.
 */
export function ImageUpload({
  scope,
  ownerId,
  value,
  onChange,
  label,
  /** Square for avatars, wide for covers. */
  aspect = "square",
  disabled,
}: {
  scope: MediaScope;
  ownerId: string | undefined;
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  aspect?: "square" | "wide";
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useUploadImage();

  // Without an owner id there is no path to upload into — a vendor who hasn't
  // applied yet, for instance.
  const ready = Boolean(ownerId) && !disabled;

  const handleFile = async (file: File | undefined) => {
    if (!file || !ownerId) return;
    try {
      const { url } = await uploadImage({ scope, ownerId, file });
      onChange(url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      // Allow re-picking the same file after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>

      <div
        className={`relative overflow-hidden rounded-md border border-border bg-muted ${
          aspect === "wide" ? "aspect-[3/1]" : "h-24 w-24"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied
          // URLs from Supabase Storage; next/image would need remote patterns
          // configured per project.
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!ready || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isUploading}
            onClick={() => onChange(null)}
          >
            <X className="h-3 w-3 mr-1" /> Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
