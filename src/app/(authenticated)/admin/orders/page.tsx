"use client";


import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/format";

export default AdminOrders;

function AdminOrders() {
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("id,status,total_naira,created_at,delivery_name,delivery_city,delivery_state,user_id")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Orders</h1>
      <div className="space-y-2">
        {(data ?? []).map((o) => (
          <div key={o.id} className="rounded-md border border-border p-4 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{o.delivery_name ?? "—"} <span className="text-xs text-muted-foreground">· {o.delivery_city ?? ""} {o.delivery_state ?? ""}</span></p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <Badge className="capitalize">{o.status.replace("_"," ")}</Badge>
            <span className="font-semibold text-primary">{formatNaira(o.total_naira)}</span>
          </div>
        ))}
        {!data?.length && <p className="text-muted-foreground text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}
