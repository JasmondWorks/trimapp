"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";

export default MyBookings;

function MyBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("bookings")
        .select(
          "id,scheduled_at,status,notes,mode,address,total_amount,payment_status,vendor_id,service_id,vendors(business_name),services(name,duration_minutes)",
        )
        .eq("user_id", u.user.id)
        .order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cancelled");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });

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
                      onClick={() => cancel.mutate(b.id)}
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
