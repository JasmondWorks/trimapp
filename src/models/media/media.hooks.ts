"use client";

import { useMutation } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";

import { deleteImage, uploadImage } from "./media.services";
import type { MediaScope } from "./media.types";

export function useUploadImage() {
  const mutation = useMutation({
    mutationFn: ({ scope, ownerId, file }: { scope: MediaScope; ownerId: string; file: File }) => {
      const body = new FormData();
      body.set("scope", scope);
      body.set("ownerId", ownerId);
      body.set("file", file);
      return unwrap(uploadImage(body));
    },
  });

  return { uploadImage: mutation.mutateAsync, isUploading: mutation.isPending };
}

export function useDeleteImage() {
  const mutation = useMutation({
    mutationFn: (path: string) => unwrap(deleteImage({ path })),
  });

  return { deleteImage: mutation.mutateAsync, isDeleting: mutation.isPending };
}
