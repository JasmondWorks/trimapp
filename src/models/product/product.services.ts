"use server";

import { getPublicClient, requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";
import { slugify } from "@/lib/format";
import { requireMyVendorId, resolveMyVendorId } from "@/models/vendor/vendor.server";

import {
  PRODUCT_COLUMNS,
  PRODUCT_SELECT,
  PRODUCT_TABLES,
  SHOP_PRODUCT_LIMIT,
  SLUG_SUFFIX_LENGTH,
} from "./product.constants";
import {
  createProductSchema,
  productIdSchema,
  productSlugSchema,
  updateProductSchema,
} from "./product.schemas";
import type { ProductCard, ProductDetail, VendorProduct } from "./product.types";

/** Slugs must be unique across the catalogue, so append a short random tail. */
function buildSlug(title: string): string {
  const suffix = Math.random()
    .toString(36)
    .slice(2, 2 + SLUG_SUFFIX_LENGTH);
  return `${slugify(title)}-${suffix}`;
}

/** Public: in-stock, active products for the shop grid. */
export async function listShopProducts(): Promise<ApiResponse<ProductCard[]>> {
  try {
    const { data, error } = await getPublicClient()
      .from(PRODUCT_TABLES.VENDOR_PRODUCTS)
      .select(PRODUCT_SELECT.CARD)
      .eq(PRODUCT_COLUMNS.IS_ACTIVE, true)
      .gt(PRODUCT_COLUMNS.STOCK, 0)
      .limit(SHOP_PRODUCT_LIMIT);
    if (error) throw error;
    return ok((data ?? []) as unknown as ProductCard[]);
  } catch (error) {
    return failFrom(error, "Could not load products");
  }
}

/** Public: a single product by its slug. */
export async function getProductBySlug(slug: unknown): Promise<ApiResponse<ProductDetail | null>> {
  const parsed = productSlugSchema.safeParse(slug);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid product");

  try {
    const { data, error } = await getPublicClient()
      .from(PRODUCT_TABLES.VENDOR_PRODUCTS)
      .select(PRODUCT_SELECT.DETAIL)
      .eq(PRODUCT_COLUMNS.SLUG, parsed.data)
      .maybeSingle();
    if (error) throw error;
    return ok((data ?? null) as unknown as ProductDetail | null);
  } catch (error) {
    return failFrom(error, "Could not load this product");
  }
}

/** The caller's own catalogue, including inactive and out-of-stock rows. */
export async function listMyProducts(): Promise<ApiResponse<VendorProduct[]>> {
  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await resolveMyVendorId(client, userId);
    if (!vendorId) return ok([]);

    const { data, error } = await client
      .from(PRODUCT_TABLES.VENDOR_PRODUCTS)
      .select(PRODUCT_SELECT.FULL)
      .eq(PRODUCT_COLUMNS.VENDOR_ID, vendorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return failFrom(error, "Could not load your products");
  }
}

export async function createProduct(input: unknown): Promise<ApiResponse<VendorProduct>> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the form and try again");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);

    const { data, error } = await client
      .from(PRODUCT_TABLES.VENDOR_PRODUCTS)
      .insert({ ...parsed.data, vendor_id: vendorId, slug: buildSlug(parsed.data.title) })
      .select(PRODUCT_SELECT.FULL)
      .single();
    if (error) throw error;
    return ok(data, "Product added");
  } catch (error) {
    return failFrom(error, "Could not add this product");
  }
}

export async function updateProduct(input: unknown): Promise<ApiResponse<VendorProduct>> {
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check the form and try again");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);

    const { id, ...changes } = parsed.data;
    const { data, error } = await client
      .from(PRODUCT_TABLES.VENDOR_PRODUCTS)
      .update(changes)
      .eq(PRODUCT_COLUMNS.ID, id)
      .eq(PRODUCT_COLUMNS.VENDOR_ID, vendorId)
      .select(PRODUCT_SELECT.FULL)
      .single();
    if (error) throw error;
    return ok(data, "Product updated");
  } catch (error) {
    return failFrom(error, "Could not update this product");
  }
}

export async function deleteProduct(id: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = productIdSchema.safeParse(id);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid product");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);

    const { error } = await client
      .from(PRODUCT_TABLES.VENDOR_PRODUCTS)
      .delete()
      .eq(PRODUCT_COLUMNS.ID, parsed.data)
      .eq(PRODUCT_COLUMNS.VENDOR_ID, vendorId);
    if (error) throw error;
    return ok({ message: "Product removed" });
  } catch (error) {
    return failFrom(error, "Could not remove this product");
  }
}
