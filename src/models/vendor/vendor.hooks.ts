"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";
import { AUTH_QUERY_KEYS } from "@/models/auth/auth.constants";

import { VENDOR_QUERY_KEYS } from "./vendor.constants";
import {
  applyAsVendor,
  getMyVendor,
  getMyVendorStats,
  getVendorById,
  listAllVendors,
  listApprovedVendors,
  setVendorStatus,
  setVendorVerified,
  updateMyVendor,
} from "./vendor.services";
import type { ApplyAsVendorInput, UpdateVendorInput, VendorStatus } from "./vendor.types";

export function useApprovedVendors() {
  const query = useQuery({
    queryKey: VENDOR_QUERY_KEYS.approved(),
    queryFn: () => unwrap(listApprovedVendors()),
  });

  return { vendors: query.data ?? emptyList(), isLoading: query.isPending, error: query.error };
}

export function useVendor(id: string | undefined) {
  const query = useQuery({
    queryKey: VENDOR_QUERY_KEYS.detail(id ?? ""),
    queryFn: () => unwrap(getVendorById(id!)),
    enabled: !!id,
  });

  return { vendor: query.data ?? null, isLoading: query.isPending, error: query.error };
}

export function useMyVendor() {
  const query = useQuery({
    queryKey: VENDOR_QUERY_KEYS.me(),
    queryFn: () => unwrap(getMyVendor()),
  });

  return { vendor: query.data ?? null, isLoading: query.isPending, error: query.error };
}

export function useMyVendorStats() {
  const query = useQuery({
    queryKey: VENDOR_QUERY_KEYS.stats(),
    queryFn: () => unwrap(getMyVendorStats()),
  });

  return { stats: query.data ?? null, isLoading: query.isPending };
}

export function useApplyAsVendor() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: ApplyAsVendorInput) => unwrap(applyAsVendor(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all });
      // The application grants the vendor role, which gates /vendor.
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.roles() });
    },
  });

  return { apply: mutation.mutateAsync, isApplying: mutation.isPending };
}

export function useUpdateMyVendor() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: UpdateVendorInput) => unwrap(updateMyVendor(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all }),
  });

  return { updateVendor: mutation.mutateAsync, isSaving: mutation.isPending };
}

export function useAllVendors() {
  const query = useQuery({
    queryKey: VENDOR_QUERY_KEYS.admin(),
    queryFn: () => unwrap(listAllVendors()),
  });

  return { vendors: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useModerateVendor() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: VENDOR_QUERY_KEYS.all });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: VendorStatus }) => unwrap(setVendorStatus(input)),
    onSuccess: invalidate,
  });

  const verifiedMutation = useMutation({
    mutationFn: (input: { id: string; verified: boolean }) => unwrap(setVendorVerified(input)),
    onSuccess: invalidate,
  });

  return {
    setStatus: statusMutation.mutateAsync,
    setVerified: verifiedMutation.mutateAsync,
    isUpdating: statusMutation.isPending || verifiedMutation.isPending,
  };
}
