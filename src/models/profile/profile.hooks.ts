"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";

import { PROFILE_QUERY_KEYS } from "./profile.constants";
import { getMyProfile, updateMyProfile } from "./profile.services";
import type { UpdateProfileInput } from "./profile.types";

export function useMyProfile() {
  const query = useQuery({
    queryKey: PROFILE_QUERY_KEYS.me(),
    queryFn: () => unwrap(getMyProfile()),
  });

  return {
    profile: query.data?.profile ?? null,
    email: query.data?.email ?? "",
    isLoading: query.isPending,
  };
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => unwrap(updateMyProfile(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.all }),
  });

  return { updateProfile: mutation.mutateAsync, isSaving: mutation.isPending };
}
