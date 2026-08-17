import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { applyAsVendorSchema, updateVendorSchema } from "./vendor.schemas";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type Vendor = Tables["vendors"]["Row"];
export type VendorStatus = Enums["vendor_status"];
export type VendorCategory = Enums["vendor_category"];
export type ServiceMode = Enums["service_mode"];

/** The projection `VENDOR_SELECT.CARD` returns — used by discover and the map. */
export type VendorCard = Pick<
  Vendor,
  | "id"
  | "business_name"
  | "category"
  | "city"
  | "state"
  | "address"
  | "latitude"
  | "longitude"
  | "service_mode"
  | "is_verified"
  | "rating"
  | "reviews_count"
  | "avatar_url"
  | "cover_url"
>;

export interface VendorStats {
  bookingsCount: number;
  itemsSold: number;
  pendingBookings: Array<
    Pick<Tables["bookings"]["Row"], "id" | "scheduled_at" | "status" | "total_amount">
  >;
}

export type ApplyAsVendorInput = z.input<typeof applyAsVendorSchema>;
export type UpdateVendorInput = z.input<typeof updateVendorSchema>;
