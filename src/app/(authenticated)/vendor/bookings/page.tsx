"use client";


import { useSetBookingStatus, useVendorBookings } from "@/models/booking/booking.hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import type { BookingStatus } from "@/models/booking/booking.types";

export default VendorBookings;

function VendorBookings() {
  const { bookings } = useVendorBookings();
  const { setStatus } = useSetBookingStatus();

  const handleStatus = async (id: string, status: BookingStatus) => {
    try {
      await setStatus({ id, status });
      toast.success("Updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl mb-4">Incoming bookings</h1>
      {!bookings?.length ? <p className="text-muted-foreground text-sm">No bookings yet.</p> : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-md border border-border p-4 flex flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{b.services?.name ?? "Service"}</p>
                <p className="text-sm text-muted-foreground">{new Date(b.scheduled_at).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{b.mode === "home" ? `Home · ${b.address ?? ""}` : "In-shop"}</p>
                {b.notes && <p className="text-xs mt-1">Note: {b.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="capitalize">{b.status}</Badge>
                <span className="font-semibold text-primary">{formatNaira(b.total_amount)}</span>
                {b.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => void handleStatus(b.id, "confirmed")}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => void handleStatus(b.id, "cancelled")}>Decline</Button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <Button size="sm" onClick={() => void handleStatus(b.id, "completed")}>Mark done</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
