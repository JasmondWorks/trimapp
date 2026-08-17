import { z } from "zod";

import {
  DEFAULT_HOME_RADIUS_KM,
  SERVICE_MODES,
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
} from "./vendor.constants";

/** Trims, then maps "" to null so empty inputs clear the column. */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional()
  .refine((v) => v === null || v === undefined || /^https?:\/\//.test(v), {
    message: "Must be a URL starting with http:// or https://",
  });

/** Number-ish text from an `<input type="number">`. */
const numericText = z.union([z.number(), z.string()]).transform((v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
});

export const vendorCategorySchema = z.enum(VENDOR_CATEGORIES);
export const serviceModeSchema = z.enum(SERVICE_MODES);
export const vendorStatusSchema = z.enum(VENDOR_STATUSES);

export const applyAsVendorSchema = z.object({
  business_name: z.string().trim().min(2, "Business name is required"),
  bio: optionalText,
  category: vendorCategorySchema,
  address: optionalText,
  city: optionalText,
  state: z.string().min(1, "Pick a state"),
  phone: optionalText,
  service_mode: serviceModeSchema,
  home_radius_km: numericText.transform((v) => v ?? DEFAULT_HOME_RADIUS_KM),
});

export const updateVendorSchema = applyAsVendorSchema.extend({
  latitude: numericText.nullable().optional(),
  longitude: numericText.nullable().optional(),
  avatar_url: optionalUrl,
  cover_url: optionalUrl,
  portfolio_urls: z.array(z.string().trim().min(1)).default([]),
});

export const setVendorStatusSchema = z.object({
  id: z.string().uuid(),
  status: vendorStatusSchema,
});

export const setVendorVerifiedSchema = z.object({
  id: z.string().uuid(),
  verified: z.boolean(),
});
