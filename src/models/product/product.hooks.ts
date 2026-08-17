"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";

import { PRODUCT_QUERY_KEYS } from "./product.constants";
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  listMyProducts,
  listShopProducts,
  updateProduct,
} from "./product.services";
import type { CreateProductInput, UpdateProductInput } from "./product.types";

export function useShopProducts() {
  const query = useQuery({
    queryKey: PRODUCT_QUERY_KEYS.shop(),
    queryFn: () => unwrap(listShopProducts()),
  });

  return { products: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useProduct(slug: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(slug ?? ""),
    queryFn: () => unwrap(getProductBySlug(slug!)),
    enabled: enabled && !!slug,
  });

  return { product: query.data ?? null, isLoading: query.isPending };
}

export function useMyProducts() {
  const query = useQuery({
    queryKey: PRODUCT_QUERY_KEYS.mine(),
    queryFn: () => unwrap(listMyProducts()),
  });

  return { products: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useManageProducts() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });

  const createMutation = useMutation({
    mutationFn: (input: CreateProductInput) => unwrap(createProduct(input)),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (input: UpdateProductInput) => unwrap(updateProduct(input)),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(deleteProduct(id)),
    onSuccess: invalidate,
  });

  return {
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
