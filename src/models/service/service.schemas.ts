import { z } from "zod";

import { DEFAULT_SERVICE_CATEGORY, DEFAULT_SERVICE_DURATION_MINUTES } from "./service.constants";

const price = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : parseFloat(v)))
  .refine((v) => Number.isFinite(v) && v >= 0, { message: "Enter a valid price" });

const duration = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : parseInt(v, 10)))
  .transform((v) => (Number.isFinite(v) && v > 0 ? v : DEFAULT_SERVICE_DURATION_MINUTES));

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Give the service a name"),
  price,
  duration_minutes: duration,
  description: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
  category: z.string().trim().min(1).default(DEFAULT_SERVICE_CATEGORY),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

export const serviceIdSchema = z.string().uuid("Invalid service");
