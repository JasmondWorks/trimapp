"use client";

import Link from "next/link";
import { useCancelBooking, useMyBookings } from "@/models/booking/booking.hooks";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";

export default MyBookings;

function MyBookings() {
  const { bookings: data, isLoading } = useMyBookings();
  const { cancelBooking } = useCancelBooking();

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id);
      toast.success("Cancelled");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl mb-6">My bookings</h1>
        {isLoading ? (
          <p>Loading…</p>
        ) : !data?.length ? (
          <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
            No bookings yet.{" "}
            <Link href="/discover" className="text-primary underline">
              Find a salon
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-border bg-card p-4 flex flex-wrap gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {b.services?.name ?? "Service"}{" "}
                    <span className="text-muted-foreground text-sm">
                      · {b.vendors?.business_name ?? ""}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(b.scheduled_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.mode === "home"
                      ? `Home service · ${b.address ?? ""}`
                      : "In-shop"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      b.status === "cancelled" ? "destructive" : "secondary"
                    }
                    className="capitalize"
                  >
                    {b.status}
                  </Badge>
                  <span className="font-semibold text-primary">
                    {formatNaira(b.total_amount)}
                  </span>
                  {b.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleCancel(b.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
