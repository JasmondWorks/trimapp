import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { BOOKING_MODES, BOOKING_STATUSES } from "./booking.constants";
import type { createBookingSchema, setBookingStatusSchema } from "./booking.schemas";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingMode = (typeof BOOKING_MODES)[number];

/** Joined shape returned by `BOOKING_SELECT.MINE`. */
export interface MyBooking {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  mode: Database["public"]["Enums"]["service_mode"];
  address: string | null;
  total_amount: number;
  payment_status: string;
  vendor_id: string | null;
  service_id: string;
  vendors: { business_name: string } | null;
  services: { name: string; duration_minutes: number } | null;
}

/** Joined shape returned by `BOOKING_SELECT.VENDOR`. */
export interface VendorBooking {
  id: string;
  scheduled_at: string;
  status: string;
  mode: Database["public"]["Enums"]["service_mode"];
  address: string | null;
  notes: string | null;
  total_amount: number;
  services: { name: string } | null;
}

/** Joined shape returned by `BOOKING_SELECT.ADMIN`. */
export interface AdminBooking {
  id: string;
  scheduled_at: string;
  status: string;
  total_amount: number;
  vendors: { business_name: string } | null;
  services: { name: string } | null;
}

export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type SetBookingStatusInput = z.input<typeof setBookingStatusSchema>;
