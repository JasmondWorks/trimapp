"use server";

import { getPublicClient, requireServerSession } from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";
import { PRODUCT_COLUMNS, PRODUCT_SELECT, PRODUCT_TABLES } from "@/models/product/product.constants";
import { requireMyVendorId, resolveMyVendorId } from "@/models/vendor/vendor.server";

import {
  INITIAL_ORDER_STATUS,
  ORDER_COLUMNS,
  ORDER_SELECT,
  ORDER_TABLES,
  PERCENT_DIVISOR,
} from "./order.constants";
import { checkoutSchema, setFulfillmentStatusSchema } from "./order.schemas";
import type { AdminOrder, MyOrder, VendorOrderItem } from "./order.types";

/** The signed-in customer's orders with their line items. */
export async function listMyOrders(): Promise<ApiResponse<MyOrder[]>> {
  try {
    const { client, userId } = await requireServerSession();
    const { data, error } = await client
      .from(ORDER_TABLES.ORDERS)
      .select(ORDER_SELECT.MINE)
      .eq(ORDER_COLUMNS.USER_ID, userId)
      .order(ORDER_COLUMNS.CREATED_AT, { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as unknown as MyOrder[]);
  } catch (error) {
    return failFrom(error, "Could not load your orders");
  }
}

/** Platform-wide orders. RLS restricts this to admins. */
export async function listAllOrders(): Promise<ApiResponse<AdminOrder[]>> {
  try {
    const { client } = await requireServerSession();
    const { data, error } = await client
      .from(ORDER_TABLES.ORDERS)
      .select(ORDER_SELECT.ADMIN)
      .order(ORDER_COLUMNS.CREATED_AT, { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return failFrom(error, "Could not load orders");
  }
}

/** The caller's fulfilment queue — line items they are the seller for. */
export async function listMyVendorOrderItems(): Promise<ApiResponse<VendorOrderItem[]>> {
  try {
    const { client, userId } = await requireServerSession();
    // Same as the vendor bookings read: no shop is an empty queue, not a fault.
    const vendorId = await resolveMyVendorId(client, userId);
    if (!vendorId) return ok([]);

    const { data, error } = await client
      .from(ORDER_TABLES.ORDER_ITEMS)
      .select(ORDER_SELECT.VENDOR_ITEMS)
      .eq(ORDER_COLUMNS.SELLER_VENDOR_ID, vendorId)
      .order(ORDER_COLUMNS.CREATED_AT, { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as unknown as VendorOrderItem[]);
  } catch (error) {
    return failFrom(error, "Could not load your orders");
  }
}

/**
 * Places an order for the vendor half of the cart.
 *
 * Everything priced is re-read here: the client sends only product ids and
 * quantities. Stock is checked before the insert, and the order total is the
 * sum the server computed, never one the browser supplied.
 */
export async function checkout(input: unknown): Promise<ApiResponse<{ orderId: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Check your delivery details");

  try {
    const { client, userId } = await requireServerSession();
    const { delivery, lines } = parsed.data;

    const { data: products, error: productsError } = await getPublicClient()
      .from(PRODUCT_TABLES.VENDOR_PRODUCTS)
      .select(PRODUCT_SELECT.CARD)
      .in(
        PRODUCT_COLUMNS.ID,
        lines.map((l) => l.productId),
      );
    if (productsError) throw productsError;

    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    const missing = lines.find((l) => !byId.has(l.productId));
    if (missing) return failFrom(null, "One of your items is no longer available");

    const outOfStock = lines.find((l) => (byId.get(l.productId)?.stock ?? 0) < l.quantity);
    if (outOfStock) {
      return failFrom(null, `${byId.get(outOfStock.productId)?.title} is out of stock`);
    }

    const items = lines.map((line) => {
      const product = byId.get(line.productId)!;
      const commissionPct = product.vendors?.commission_pct ?? 0;
      return {
        source: "vendor" as const,
        vendor_product_id: product.id,
        seller_vendor_id: product.vendor_id,
        title: product.title,
        image_url: product.images[0] ?? null,
        unit_price: product.price_naira,
        quantity: line.quantity,
        commission_amount: Math.round(
          (product.price_naira * line.quantity * commissionPct) / PERCENT_DIVISOR,
        ),
      };
    });

    const totalNaira = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    const { data: order, error: orderError } = await client
      .from(ORDER_TABLES.ORDERS)
      .insert({
        user_id: userId,
        total_naira: totalNaira,
        status: INITIAL_ORDER_STATUS,
        delivery_name: delivery.name,
        delivery_phone: delivery.phone,
        delivery_address: delivery.address,
        delivery_city: delivery.city,
        delivery_state: delivery.state,
        notes: delivery.notes ?? null,
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await client
      .from(ORDER_TABLES.ORDER_ITEMS)
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) {
      // Postgres has no transaction across two PostgREST calls, so roll the
      // header back by hand rather than leaving an order with no items.
      await client.from(ORDER_TABLES.ORDERS).delete().eq(ORDER_COLUMNS.ID, order.id);
      throw itemsError;
    }

    return ok({ orderId: order.id }, "Order placed");
  } catch (error) {
    return failFrom(error, "Could not place your order");
  }
}

/** Vendor moves one of their line items along the fulfilment path. */
export async function setFulfillmentStatus(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = setFulfillmentStatusSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid status");

  try {
    const { client, userId } = await requireServerSession();
    const vendorId = await requireMyVendorId(client, userId);
    const { error } = await client
      .from(ORDER_TABLES.ORDER_ITEMS)
      .update({ fulfillment_status: parsed.data.status })
      .eq(ORDER_COLUMNS.ID, parsed.data.id)
      .eq(ORDER_COLUMNS.SELLER_VENDOR_ID, vendorId);
    if (error) throw error;
    return ok({ message: "Order updated" });
  } catch (error) {
    return failFrom(error, "Could not update this order");
  }
}
