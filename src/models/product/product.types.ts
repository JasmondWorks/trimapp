import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { PRODUCT_SOURCES } from "./product.constants";
import type { createProductSchema, updateProductSchema } from "./product.schemas";

export type VendorProduct = Database["public"]["Tables"]["vendor_products"]["Row"];
export type ProductSource = (typeof PRODUCT_SOURCES)[number];

/** `PRODUCT_SELECT.CARD` — the shop grid. */
export interface ProductCard {
  id: string;
  vendor_id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  price_naira: number;
  stock: number;
  images: string[];
  vendors: { business_name: string; commission_pct: number } | null;
}

/** `PRODUCT_SELECT.DETAIL` — the product page, which needs the vendor id too. */
export type ProductDetail = VendorProduct & {
  vendors: { id: string; business_name: string; commission_pct: number } | null;
};

export type CreateProductInput = z.input<typeof createProductSchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;
