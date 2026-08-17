"use client";


import { useAllBookings } from "@/models/booking/booking.hooks";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/format";

export default AdminBookings;

function AdminBookings() {
  const { bookings: data } = useAllBookings();

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Bookings</h1>
      <div className="space-y-2">
        {(data ?? []).map((b) => (
          <div key={b.id} className="rounded-md border border-border p-4 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{b.services?.name ?? "Service"} <span className="text-xs text-muted-foreground">· {b.vendors?.business_name ?? ""}</span></p>
              <p className="text-xs text-muted-foreground">{new Date(b.scheduled_at).toLocaleString()}</p>
            </div>
            <Badge className="capitalize">{b.status}</Badge>
            <span className="font-semibold text-primary">{formatNaira(b.total_amount)}</span>
          </div>
        ))}
        {!data?.length && <p className="text-muted-foreground text-sm">No bookings yet.</p>}
      </div>
    </div>
  );
}
