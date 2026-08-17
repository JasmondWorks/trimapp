"use client";

import Link from "next/link";
import { useMyOrders } from "@/models/order/order.hooks";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/format";

export default Orders;

function Orders() {
  const { orders: data, isLoading } = useMyOrders();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl mb-6">My orders</h1>
        {isLoading ? (
          <p>Loading…</p>
        ) : !data?.length ? (
          <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
            No orders yet.{" "}
            <Link href="/shop" className="text-primary underline">
              Start shopping
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((o) => {
              type Item = {
                id: string;
                title: string;
                quantity: number;
                unit_price: number;
                source: string;
                seller_vendor_id: string | null;
                fulfillment_status: string;
                vendors: { business_name: string } | null;
              };
              const items = (o.order_items ?? []) as Item[];
              const grouped: Record<string, Item[]> = {};
              for (const it of items) {
                const key = it.seller_vendor_id ?? "trimapp";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(it);
              }
              return (
                <div
                  key={o.id}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Order · {new Date(o.created_at).toLocaleDateString()}
                      </p>
                      <p className="font-display text-lg">
                        {formatNaira(o.total_naira)}
                      </p>
                    </div>
                    <Badge className="capitalize">
                      {o.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(grouped).map(([k, arr]) => (
                      <div key={k} className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {k === "trimapp"
                            ? "TrimApp store"
                            : `Vendor: ${arr[0].vendors?.business_name ?? k}`}{" "}
                          ·{" "}
                          <span className="capitalize">
                            {arr[0].fulfillment_status}
                          </span>
                        </p>
                        {arr.map((it) => (
                          <div
                            key={it.id}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {it.title} × {it.quantity}
                            </span>
                            <span>
                              {formatNaira(it.unit_price * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
