"use client";


import { usePlatformOverview } from "@/models/admin/admin.hooks";
import { formatNaira } from "@/lib/format";

export default AdminOverview;

function AdminOverview() {
  const { overview: data } = usePlatformOverview();

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
