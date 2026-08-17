"use server";

import { requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse } from "@/lib/api";
import { BOOKING_TABLES } from "@/models/booking/booking.constants";
import { ORDER_SELECT, ORDER_TABLES } from "@/models/order/order.constants";
import { VENDOR_TABLES } from "@/models/vendor/vendor.constants";

import type { PlatformOverview } from "./admin.types";

/**
 * Platform counters for the admin dashboard.
 *
 * Reads are RLS-gated: a non-admin session sees only its own rows and gets
 * numbers that reflect that, rather than an error. The admin-only route guard
 * is what keeps non-admins off this page in the first place.
 */
export async function getPlatformOverview(): Promise<ApiResponse<PlatformOverview>> {
  try {
    const { client } = await requireServerSession();

    const [vendors, bookings, orders] = await Promise.all([
      client.from(VENDOR_TABLES.VENDORS).select("id,status"),
      client.from(BOOKING_TABLES.BOOKINGS).select("id,total_amount"),
      client.from(ORDER_TABLES.ORDERS).select(ORDER_SELECT.TOTALS),
    ]);
    if (vendors.error) throw vendors.error;
    if (bookings.error) throw bookings.error;
    if (orders.error) throw orders.error;

    const gmvBookings = (bookings.data ?? []).reduce((n, b) => n + Number(b.total_amount ?? 0), 0);
    const gmvOrders = (orders.data ?? []).reduce((n, o) => n + Number(o.total_naira ?? 0), 0);

    return ok({
      vendorsPending: (vendors.data ?? []).filter((v) => v.status === "pending").length,
      vendorsApproved: (vendors.data ?? []).filter((v) => v.status === "approved").length,
      bookingsCount: bookings.data?.length ?? 0,
      ordersCount: orders.data?.length ?? 0,
      gmv: gmvBookings + gmvOrders,
    });
  } catch (error) {
    return failFrom(error, "Could not load the dashboard");
  }
}
