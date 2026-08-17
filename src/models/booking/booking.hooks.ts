"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";

import { BOOKING_QUERY_KEYS } from "./booking.constants";
import {
  cancelBooking,
  createBooking,
  listAllBookings,
  listMyBookings,
  listVendorBookings,
  setBookingStatus,
} from "./booking.services";
import type { CreateBookingInput, SetBookingStatusInput } from "./booking.types";

export function useMyBookings(enabled = true) {
  const query = useQuery({
    queryKey: BOOKING_QUERY_KEYS.mine(),
    queryFn: () => unwrap(listMyBookings()),
    enabled,
  });

  return { bookings: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useVendorBookings(enabled = true) {
  const query = useQuery({
    queryKey: BOOKING_QUERY_KEYS.vendor(),
    queryFn: () => unwrap(listVendorBookings()),
    enabled,
  });

  return { bookings: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useAllBookings() {
  const query = useQuery({
    queryKey: BOOKING_QUERY_KEYS.admin(),
    queryFn: () => unwrap(listAllBookings()),
  });

  return { bookings: query.data ?? emptyList(), isLoading: query.isPending };
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateBookingInput) => unwrap(createBooking(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all }),
  });

  return { createBooking: mutation.mutateAsync, isBooking: mutation.isPending };
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => unwrap(cancelBooking(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all }),
  });

  return { cancelBooking: mutation.mutateAsync, isCancelling: mutation.isPending };
}

export function useSetBookingStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: SetBookingStatusInput) => unwrap(setBookingStatus(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOOKING_QUERY_KEYS.all }),
  });

  return { setStatus: mutation.mutateAsync, isUpdating: mutation.isPending };
}
