"use client";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default VendorOrders;

const NEXT: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function VendorOrders() {
  const qc = useQueryClient();
  const { data: vendor } = useQuery({
    queryKey: ["me-vendor"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("vendors").select("id").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const { data: items } = useQuery({
    enabled: !!vendor?.id,
    queryKey: ["vendor-items", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("order_items")
        .select("id,title,quantity,unit_price,fulfillment_status,created_at,orders(delivery_name,delivery_city,delivery_state)")
        .eq("seller_vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setFul = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending"|"processing"|"shipped"|"delivered"|"cancelled" }) => {
      const { error } = await supabase.from("order_items").update({ fulfillment_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["vendor-items"] }); },
  });

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
                {NEXT[it.fulfillment_status]?.length > 0 && (
                  <Select onValueChange={(v) => setFul.mutate({ id: it.id, status: v as "pending"|"processing"|"shipped"|"delivered"|"cancelled" })}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Move to…" /></SelectTrigger>
                    <SelectContent>
                      {NEXT[it.fulfillment_status].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button size="sm" variant="ghost" onClick={() => setFul.mutate({ id: it.id, status: "shipped" })} className="hidden">shipped</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
