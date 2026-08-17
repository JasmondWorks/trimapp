import { z } from "zod";

import { BOOKING_MODES, BOOKING_STATUSES } from "./booking.constants";

export const bookingModeSchema = z.enum(BOOKING_MODES);
export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

/**
 * What the client is allowed to send when booking.
 *
 * Notably absent: `total_amount` and `commission_amount`. Both are derived
 * server-side from the service's price and the vendor's commission rate — a
 * price sent by the browser is a price a customer can edit.
 */
export const createBookingSchema = z
  .object({
    vendorId: z.string().uuid("Pick a vendor"),
    serviceId: z.string().uuid("Pick a service"),
    /** Local date, `YYYY-MM-DD`. */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    /** Local time, `HH:mm`. */
    time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
    mode: bookingModeSchema,
    address: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((v) => v.mode !== "home" || (v.address?.length ?? 0) > 0, {
    message: "A home service needs an address",
    path: ["address"],
  });

export const setBookingStatusSchema = z.object({
  id: z.string().uuid(),
  status: bookingStatusSchema,
});

export const bookingIdSchema = z.string().uuid("Invalid booking");
