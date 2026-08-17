"use server";

import {
  getPublicClient,
  getServerSession,
  persistRoles,
  requireServerSession,
} from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";
import { AUTH_COLUMNS, AUTH_TABLES } from "@/models/auth/auth.constants";

import {
  DISCOVER_VENDOR_LIMIT,
  PENDING_BOOKINGS_PREVIEW_LIMIT,
  VENDOR_COLUMNS,
  VENDOR_SELECT,
  VENDOR_TABLES,
} from "./vendor.constants";
import {
  applyAsVendorSchema,
  setVendorStatusSchema,
  setVendorVerifiedSchema,
  updateVendorSchema,
} from "./vendor.schemas";
import type { Vendor, VendorCard, VendorStats } from "./vendor.types";

/** Public: approved vendors for the discover map/list. */
export async function listApprovedVendors(): Promise<ApiResponse<VendorCard[]>> {
  try {
    const { data, error } = await getPublicClient()
      .from(VENDOR_TABLES.VENDORS)
      .select(VENDOR_SELECT.CARD)
      .eq(VENDOR_COLUMNS.STATUS, "approved")
      .limit(DISCOVER_VENDOR_LIMIT);
    if (error) throw error;
    return ok((data ?? []) as VendorCard[]);
  } catch (error) {
    return failFrom(error, "Could not load vendors");
  }
}

/** Public: a single vendor's profile page. */
export async function getVendorById(id: string): Promise<ApiResponse<Vendor | null>> {
  try {
    const { data, error } = await getPublicClient()
      .from(VENDOR_TABLES.VENDORS)
      .select(VENDOR_SELECT.FULL)
      .eq(VENDOR_COLUMNS.ID, id)
      .maybeSingle();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return failFrom(error, "Could not load this vendor");
  }
}

/** The signed-in user's own vendor record, or null if they have none. */
export async function getMyVendor(): Promise<ApiResponse<Vendor | null>> {
  try {
    const session = await getServerSession();
    if (!session) return ok(null);

    const { data, error } = await session.client
      .from(VENDOR_TABLES.VENDORS)
      .select(VENDOR_SELECT.FULL)
      .eq(VENDOR_COLUMNS.USER_ID, session.session.user.id)
      .maybeSingle();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return failFrom(error, "Could not load your vendor account");
  }
}

export async function applyAsVendor(input: unknown): Promise<ApiResponse<Vendor>> {
  const parsed = applyAsVendorSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the form and try again");

  try {
    const { client, userId } = await requireServerSession();
    const { data, error } = await client
      .from(VENDOR_TABLES.VENDORS)
      .insert({ ...parsed.data, user_id: userId, status: "pending" })
      .select(VENDOR_SELECT.FULL)
      .single();
    if (error) throw error;

    // The vendor role is what unlocks /vendor.
    //
    // Two failures are tolerated rather than rolled back, because the
    // application itself has already been filed successfully:
    //   23505 — the role already exists (a re-application);
    //   42501 — RLS denied the insert, which happens when the self-assign
    //           policy in 20260815120000_allow_self_vendor_role.sql has not
    //           been applied to this project yet. An admin can still grant the
    //           role by hand, so losing the application would be worse.
    const { error: roleError } = await client
      .from(AUTH_TABLES.USER_ROLES)
      .insert({ [AUTH_COLUMNS.USER_ID]: userId, [AUTH_COLUMNS.ROLE]: "vendor" });
    const roleGranted = !roleError || roleError.code === "23505";
    if (roleError && roleError.code !== "23505" && roleError.code !== "42501") {
      throw roleError;
    }

    // The proxy gates /vendor on this cookie, so refresh it before we redirect.
    await persistRoles(client, userId);

    return ok(
      data,
      roleGranted
        ? "Application submitted"
        : "Application submitted — an admin will enable your vendor dashboard.",
    );
  } catch (error) {
    return failFrom(error, "Could not submit your application");
  }
}

export async function updateMyVendor(input: unknown): Promise<ApiResponse<Vendor>> {
  const parsed = updateVendorSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the form and try again");

  try {
    const { client, userId } = await requireServerSession();
    // Scoped by user_id, not by an id the client sends — a vendor can only ever
    // update their own row even if RLS were misconfigured.
    const { data, error } = await client
      .from(VENDOR_TABLES.VENDORS)
      .update(parsed.data)
      .eq(VENDOR_COLUMNS.USER_ID, userId)
      .select(VENDOR_SELECT.FULL)
      .single();
    if (error) throw error;
    return ok(data, "Profile saved");
  } catch (error) {
    return failFrom(error, "Could not save your profile");
  }
}

export async function getMyVendorStats(): Promise<ApiResponse<VendorStats | null>> {
  try {
    const session = await getServerSession();
    if (!session) return ok(null);
    const { client } = session;

    const { data: vendor, error: vendorError } = await client
      .from(VENDOR_TABLES.VENDORS)
      .select(VENDOR_SELECT.ID_ONLY)
      .eq(VENDOR_COLUMNS.USER_ID, session.session.user.id)
      .maybeSingle();
    if (vendorError) throw vendorError;
    if (!vendor) return ok(null);

    const [bookings, items, pending] = await Promise.all([
      client
        .from(VENDOR_TABLES.BOOKINGS)
        .select("id", { count: "exact", head: true })
        .eq(VENDOR_COLUMNS.VENDOR_ID, vendor.id),
      client
        .from(VENDOR_TABLES.ORDER_ITEMS)
        .select("id", { count: "exact", head: true })
        .eq(VENDOR_COLUMNS.SELLER_VENDOR_ID, vendor.id),
      client
        .from(VENDOR_TABLES.BOOKINGS)
        .select("id,scheduled_at,status,total_amount")
        .eq(VENDOR_COLUMNS.VENDOR_ID, vendor.id)
        .eq(VENDOR_COLUMNS.STATUS, "pending")
        .limit(PENDING_BOOKINGS_PREVIEW_LIMIT),
    ]);

    return ok({
      bookingsCount: bookings.count ?? 0,
      itemsSold: items.count ?? 0,
      pendingBookings: pending.data ?? [],
    });
  } catch (error) {
    return failFrom(error, "Could not load your dashboard");
  }
}

/* --- Admin moderation ---------------------------------------------------- */

/** Every vendor, newest first. RLS restricts this to admins. */
export async function listAllVendors(): Promise<ApiResponse<Vendor[]>> {
  try {
    const { client } = await requireServerSession();
    const { data, error } = await client
      .from(VENDOR_TABLES.VENDORS)
      .select(VENDOR_SELECT.FULL)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return failFrom(error, "Could not load vendors");
  }
}

export async function setVendorStatus(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = setVendorStatusSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid status");

  try {
    const { client } = await requireServerSession();
    const { error } = await client
      .from(VENDOR_TABLES.VENDORS)
      .update({ status: parsed.data.status })
      .eq(VENDOR_COLUMNS.ID, parsed.data.id);
    if (error) throw error;
    return ok({ message: "Vendor updated" });
  } catch (error) {
    return failFrom(error, "Could not update this vendor");
  }
}

export async function setVendorVerified(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = setVendorVerifiedSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid value");

  try {
    const { client } = await requireServerSession();
    const { error } = await client
      .from(VENDOR_TABLES.VENDORS)
      .update({ is_verified: parsed.data.verified })
      .eq(VENDOR_COLUMNS.ID, parsed.data.id);
    if (error) throw error;
    return ok({ message: "Vendor updated" });
  } catch (error) {
    return failFrom(error, "Could not update this vendor");
  }
}
