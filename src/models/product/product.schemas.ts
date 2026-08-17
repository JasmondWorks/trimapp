import { z } from "zod";

import { DEFAULT_PRODUCT_CATEGORY, DEFAULT_PRODUCT_STOCK } from "./product.constants";

const price = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : parseFloat(v)))
  .refine((v) => Number.isFinite(v) && v >= 0, { message: "Enter a valid price" });

const stock = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : parseInt(v, 10)))
  .transform((v) => (Number.isFinite(v) && v >= 0 ? v : DEFAULT_PRODUCT_STOCK));

/** Accepts either a newline-delimited textarea value or an array. */
const imageList = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split("\n")))
  .transform((list) => list.map((s) => s.trim()).filter(Boolean));

export const createProductSchema = z.object({
  title: z.string().trim().min(2, "Give the product a title"),
  price_naira: price,
  stock,
  category: z.string().trim().min(1).default(DEFAULT_PRODUCT_CATEGORY),
  images: imageList.default([]),
  description: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

export const productIdSchema = z.string().uuid("Invalid product");
export const productSlugSchema = z.string().min(1, "Invalid product");
