"use server";

import { getPublicClient, requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";
import { SERVICE_COLUMNS, SERVICE_TABLES } from "@/models/service/service.constants";
import { VENDOR_COLUMNS, VENDOR_TABLES } from "@/models/vendor/vendor.constants";
import { requireMyVendorId, resolveMyVendorId } from "@/models/vendor/vendor.server";

import { BOOKING_COLUMNS, BOOKING_SELECT, BOOKING_TABLES } from "./booking.constants";
import { bookingIdSchema, createBookingSchema, setBookingStatusSchema } from "./booking.schemas";
import type { AdminBooking, MyBooking, VendorBooking } from "./booking.types";

/** The signed-in customer's bookings, newest first. */
export async function listMyBookings(): Promise<ApiResponse<MyBooking[]>> {
  try {
    const { client, userId } = await requireServerSession();
    const { data, error } = await client
      .from(BOOKING_TABLES.BOOKINGS)
      .select(BOOKING_SELECT.MINE)
      .eq(BOOKING_COLUMNS.USER_ID, userId)
      .order(BOOKING_COLUMNS.SCHEDULED_AT, { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as unknown as MyBooking[]);
  } catch (error) {
    return failFrom(error, "Could not load your bookings");
  }
}

/** The caller's incoming vendor queue. */
export async function listVendorBookings(): Promise<ApiResponse<VendorBooking[]>> {
  try {
    const { client, userId } = await requireServerSession();
    // A read, so no shop means "nothing to show" rather than an error — an
    // admin browsing /vendor has no vendor row of their own.
    const vendorId = await resolveMyVendorId(client, userId);
    if (!vendorId) return ok([]);

    const { data, error } = await client
      .from(BOOKING_TABLES.BOOKINGS)
      .select(BOOKING_SELECT.VENDOR)
      .eq(BOOKING_COLUMNS.VENDOR_ID, vendorId)
      .order(BOOKING_COLUMNS.SCHEDULED_AT, { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as unknown as VendorBooking[]);
  } catch (error) {
    return failFrom(error, "Could not load your bookings");
  }
}

/** Platform-wide bookings. RLS restricts this to admins. */
export async function listAllBookings(): Promise<ApiResponse<AdminBooking[]>> {
  try {
    const { client } = await requireServerSession();
    const { data, error } = await client
      .from(BOOKING_TABLES.BOOKINGS)
      .select(BOOKING_SELECT.ADMIN)
      .order(BOOKING_COLUMNS.SCHEDULED_AT, { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as unknown as AdminBooking[]);
  } catch (error) {
    return failFrom(error, "Could not load bookings");
  }
}

export async function createBooking(input: unknown): Promise<ApiResponse<{ id: string }>> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the booking details");

  try {
    const { client, userId } = await requireServerSession();
    const { vendorId, serviceId, date, time, mode, address, notes } = parsed.data;

    // Price and commission are read from the database, never taken from the
    // request — otherwise a customer could book a ₦20,000 cut for ₦1.
    const publicClient = getPublicClient();
    const [{ data: service, error: serviceError }, { data: vendor, error: vendorError }] =
      await Promise.all([
        publicClient
          .from(SERVICE_TABLES.SERVICES)
          .select("id,price,vendor_id")
          .eq(SERVICE_COLUMNS.ID, serviceId)
          .maybeSingle(),
        publicClient
          .from(VENDOR_TABLES.VENDORS)
          .select("id,commission_pct")
          .eq(VENDOR_COLUMNS.ID, vendorId)
          .maybeSingle(),
      ]);
    if (serviceError) throw serviceError;
    if (vendorError) throw vendorError;
    if (!service || !vendor) return failFrom(null, "That service is no longer available");
    if (service.vendor_id !== vendor.id) {
      return failFrom(null, "That service does not belong to this vendor");
    }

    const scheduledAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) return failFrom(null, "Pick a valid date and time");

    const totalAmount = service.price;
    const commissionAmount = Math.round((totalAmount * vendor.commission_pct) / 100);

    const { data, error } = await client
      .from(BOOKING_TABLES.BOOKINGS)
      .insert({
        user_id: userId,
        vendor_id: vendor.id,
        service_id: service.id,
        scheduled_at: scheduledAt.toISOString(),
        mode,
        address: mode === "home" ? (address ?? null) : null,
        notes: notes || null,
        total_amount: totalAmount,
        commission_amount: commissionAmount,
        payment_status: "pending",
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    return ok({ id: data.id }, "Booking requested");
  } catch (error) {
    return failFrom(error, "Could not create your booking");
  }
}

/** Customer-initiated cancellation of their own booking. */
export async function cancelBooking(id: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = bookingIdSchema.safeParse(id);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid booking");

  try {
    const { client, userId } = await requireServerSession();
    const { error } = await client
      .from(BOOKING_TABLES.BOOKINGS)
      .update({ status: "cancelled" })
      .eq(BOOKING_COLUMNS.ID, parsed.data)
      .eq(BOOKING_COLUMNS.USER_ID, userId);
    if (error) throw error;
    return ok({ message: "Booking cancelled" });
  } catch (error) {
    return failFrom(error, "Could not cancel this booking");
  }
}

/** Vendor-initiated status change (confirm / decline / mark done). */
export async function setBookingStatus(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = setBookingStatusSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid status");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);
    const { error } = await client
      .from(BOOKING_TABLES.BOOKINGS)
      .update({ status: parsed.data.status })
      .eq(BOOKING_COLUMNS.ID, parsed.data.id)
      .eq(BOOKING_COLUMNS.VENDOR_ID, vendorId);
    if (error) throw error;
    return ok({ message: "Booking updated" });
  } catch (error) {
    return failFrom(error, "Could not update this booking");
  }
}
