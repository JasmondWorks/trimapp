"use client";


import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

export default AdminOverview;

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [vendors, bookings, orders] = await Promise.all([
        supabase.from("vendors").select("id,status", { count: "exact" }),
        supabase.from("bookings").select("id,total_amount"),
        supabase.from("orders").select("id,total_naira,status"),
      ]);
      const gmvBookings = (bookings.data ?? []).reduce((n, b) => n + Number(b.total_amount ?? 0), 0);
      const gmvOrders = (orders.data ?? []).reduce((n, o) => n + Number(o.total_naira ?? 0), 0);
      return {
        vendorsPending: (vendors.data ?? []).filter((v) => v.status === "pending").length,
        vendorsApproved: (vendors.data ?? []).filter((v) => v.status === "approved").length,
        bookingsCount: bookings.data?.length ?? 0,
        ordersCount: orders.data?.length ?? 0,
        gmv: gmvBookings + gmvOrders,
      };
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Platform overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Approved vendors" value={data?.vendorsApproved ?? 0} />
        <Stat label="Pending vendors" value={data?.vendorsPending ?? 0} highlight={(data?.vendorsPending ?? 0) > 0} />
        <Stat label="Bookings" value={data?.bookingsCount ?? 0} />
        <Stat label="Orders" value={data?.ordersCount ?? 0} />
        <Stat label="GMV" value={formatNaira(data?.gmv ?? 0)} />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
