"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";
import { PRODUCT_QUERY_KEYS } from "@/models/product/product.constants";

import { ORDER_QUERY_KEYS } from "./order.constants";
import {
  checkout,
  listAllOrders,
  listMyOrders,
  listMyVendorOrderItems,
  setFulfillmentStatus,
} from "./order.services";
import type { CheckoutInput, SetFulfillmentStatusInput } from "./order.types";

export function useMyOrders(enabled = true) {
  const query = useQuery({
    queryKey: ORDER_QUERY_KEYS.mine(),
    queryFn: () => unwrap(listMyOrders()),
    enabled,
  });

  return { orders: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useAllOrders() {
  const query = useQuery({
    queryKey: ORDER_QUERY_KEYS.admin(),
    queryFn: () => unwrap(listAllOrders()),
  });

  return { orders: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useMyVendorOrderItems(enabled = true) {
  const query = useQuery({
    queryKey: ORDER_QUERY_KEYS.vendorItems(),
    queryFn: () => unwrap(listMyVendorOrderItems()),
    enabled,
  });

  return { items: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useCheckout() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CheckoutInput) => unwrap(checkout(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
      // Stock moved, so the shop grid is stale.
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
  });

  return { checkout: mutation.mutateAsync, isPlacingOrder: mutation.isPending };
}

export function useSetFulfillmentStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: SetFulfillmentStatusInput) => unwrap(setFulfillmentStatus(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all }),
  });

  return { setFulfillmentStatus: mutation.mutateAsync, isUpdating: mutation.isPending };
}
