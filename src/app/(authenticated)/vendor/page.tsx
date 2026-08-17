"use client";

import Link from "next/link";
import { useMyVendor, useMyVendorStats } from "@/models/vendor/vendor.hooks";
import { formatNaira } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export default VendorHome;

function VendorHome() {
  const { vendor } = useMyVendor();
  const { stats } = useMyVendorStats();

  if (!vendor)
    return (
      <p className="text-muted-foreground">Setting up your vendor account…</p>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">{vendor.business_name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            {vendor.status === "approved" ? (
              <Badge className="bg-primary/10 text-primary border-primary/30">
                <ShieldCheck className="h-3 w-3 mr-1" /> Approved
              </Badge>
            ) : vendor.status === "pending" ? (
              <Badge variant="secondary">
                <ShieldAlert className="h-3 w-3 mr-1" /> Pending review
              </Badge>
            ) : (
              <Badge variant="destructive">Suspended</Badge>
            )}
            {vendor.is_verified && (
              <Badge className="bg-primary text-primary-foreground">
                Verified
              </Badge>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/vendor/profile">Edit profile</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total bookings" value={stats?.bookingsCount ?? 0} />
        <Stat label="Items sold" value={stats?.itemsSold ?? 0} />
        <Stat label="Commission" value={`${vendor.commission_pct}%`} />
      </div>

      <section>
        <h2 className="font-display text-xl mb-3">Pending bookings</h2>
        {stats?.pendingBookings.length ? (
          <div className="space-y-2">
            {stats.pendingBookings.map((b) => (
              <div
                key={b.id}
                className="rounded-md border border-border p-3 flex justify-between"
              >
                <span className="text-sm">
                  {new Date(b.scheduled_at).toLocaleString()}
                </span>
                <span className="text-primary font-semibold">
                  {formatNaira(b.total_amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pending bookings.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
