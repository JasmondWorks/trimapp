import { z } from "zod";

import { FULFILLMENT_STATUSES } from "./order.constants";

export const fulfillmentStatusSchema = z.enum(FULFILLMENT_STATUSES);

export const deliveryDetailsSchema = z.object({
  name: z.string().trim().min(2, "Recipient name is required"),
  phone: z.string().trim().min(7, "Enter a reachable phone number"),
  address: z.string().trim().min(4, "Delivery address is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(1, "Pick a state"),
  notes: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
});

/**
 * The checkout payload carries product ids and quantities only.
 *
 * Titles, images, unit prices and commission are all re-read from the database
 * server-side, so the order total cannot be talked down by editing the cart in
 * localStorage.
 */
export const checkoutSchema = z.object({
  delivery: deliveryDetailsSchema,
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, "Your cart is empty"),
});

export const setFulfillmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: fulfillmentStatusSchema,
});
