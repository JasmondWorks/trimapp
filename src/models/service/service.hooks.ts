"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";

import { SERVICE_QUERY_KEYS } from "./service.constants";
import {
  createService,
  deleteService,
  listMyServices,
  listVendorServices,
  updateService,
} from "./service.services";
import type { CreateServiceInput, UpdateServiceInput } from "./service.types";

export function useVendorServices(vendorId: string | undefined) {
  const query = useQuery({
    queryKey: SERVICE_QUERY_KEYS.byVendor(vendorId ?? ""),
    queryFn: () => unwrap(listVendorServices(vendorId!)),
    enabled: !!vendorId,
  });

  return { services: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useMyServices() {
  const query = useQuery({
    queryKey: SERVICE_QUERY_KEYS.mine(),
    queryFn: () => unwrap(listMyServices()),
  });

  return { services: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useManageServices() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: SERVICE_QUERY_KEYS.all });

  const createMutation = useMutation({
    mutationFn: (input: CreateServiceInput) => unwrap(createService(input)),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (input: UpdateServiceInput) => unwrap(updateService(input)),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(deleteService(id)),
    onSuccess: invalidate,
  });

  return {
    createService: createMutation.mutateAsync,
    updateService: updateMutation.mutateAsync,
    deleteService: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
