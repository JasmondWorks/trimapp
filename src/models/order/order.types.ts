import type { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

import type { checkoutSchema, setFulfillmentStatusSchema } from "./order.schemas";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type Order = Tables["orders"]["Row"];
export type OrderItem = Tables["order_items"]["Row"];
export type OrderStatus = Enums["order_status"];
export type FulfillmentStatus = Enums["fulfillment_status"];
export type ItemSource = Enums["item_source"];

/** `ORDER_SELECT.MINE` — the customer's order history. */
export interface MyOrder {
  id: string;
  status: OrderStatus;
  total_naira: number;
  created_at: string;
  order_items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    source: ItemSource;
    seller_vendor_id: string | null;
    fulfillment_status: FulfillmentStatus;
    vendors: { business_name: string } | null;
  }>;
}

/** `ORDER_SELECT.ADMIN` — the platform order table. */
export type AdminOrder = Pick<
  Order,
  | "id"
  | "status"
  | "total_naira"
  | "created_at"
  | "delivery_name"
  | "delivery_city"
  | "delivery_state"
  | "user_id"
>;

/** `ORDER_SELECT.VENDOR_ITEMS` — a vendor's fulfilment queue. */
export interface VendorOrderItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  orders: {
    delivery_name: string | null;
    delivery_city: string | null;
    delivery_state: string | null;
  } | null;
}

/** A cart line as the checkout action receives it. */
export interface CheckoutLine {
  productId: string;
  quantity: number;
}

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type SetFulfillmentStatusInput = z.input<typeof setFulfillmentStatusSchema>;
