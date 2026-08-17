import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { VENDOR_COLUMNS, VENDOR_SELECT, VENDOR_TABLES } from "./vendor.constants";

/**
 * Server-side helpers shared by the vendor-scoped domains (services, products,
 * bookings, orders). Kept out of `vendor.services.ts` because a "use server"
 * module may only export async server actions — these are internal utilities.
 */

/**
 * The caller's vendor id, or null if they haven't applied.
 *
 * Vendor-owned writes derive the vendor id from the session rather than
 * trusting one sent by the client, so a crafted request cannot write rows
 * against someone else's shop.
 */
export async function resolveMyVendorId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from(VENDOR_TABLES.VENDORS)
    .select(VENDOR_SELECT.ID_ONLY)
    .eq(VENDOR_COLUMNS.USER_ID, userId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export class NoVendorAccountError extends Error {
  constructor(message = "You don't have a vendor account yet.") {
    super(message);
    this.name = "NoVendorAccountError";
  }
}

/** Vendor-id-or-throw, for actions that cannot proceed without a shop. */
export async function requireMyVendorId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const vendorId = await resolveMyVendorId(client, userId);
  if (!vendorId) throw new NoVendorAccountError();
  return vendorId;
}
