"use client";


import { useMyVendorOrderItems, useSetFulfillmentStatus } from "@/models/order/order.hooks";
import { FULFILLMENT_TRANSITIONS } from "@/models/order/order.constants";
import type { FulfillmentStatus } from "@/models/order/order.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default VendorOrders;

function VendorOrders() {
  const { items } = useMyVendorOrderItems();
  const { setFulfillmentStatus } = useSetFulfillmentStatus();

  const handleFulfillment = async (id: string, status: FulfillmentStatus) => {
    try {
      await setFulfillmentStatus({ id, status });
      toast.success("Updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl mb-4">Your product orders</h1>
      {!items?.length ? <p className="text-muted-foreground text-sm">No orders yet.</p> : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="rounded-md border border-border p-4 flex flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{it.title} × {it.quantity}</p>
                <p className="text-xs text-muted-foreground">{it.orders?.delivery_name ?? ""} · {it.orders?.delivery_city ?? ""}, {it.orders?.delivery_state ?? ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="capitalize">{it.fulfillment_status}</Badge>
                <span className="font-semibold text-primary">{formatNaira(it.unit_price * it.quantity)}</span>
                {FULFILLMENT_TRANSITIONS[it.fulfillment_status]?.length > 0 && (
                  <Select onValueChange={(v) => void handleFulfillment(it.id, v as FulfillmentStatus)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Move to…" /></SelectTrigger>
                    <SelectContent>
                      {FULFILLMENT_TRANSITIONS[it.fulfillment_status].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button size="sm" variant="ghost" onClick={() => void handleFulfillment(it.id, "shipped")} className="hidden">shipped</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
