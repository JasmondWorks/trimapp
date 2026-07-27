"use client";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";

export default VendorBookings;

function VendorBookings() {
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

  const { data: bookings } = useQuery({
    enabled: !!vendor?.id,
    queryKey: ["vendor-bookings", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("bookings")
        .select("id,scheduled_at,status,mode,address,notes,total_amount,services(name)")
        .eq("vendor_id", vendor!.id)
        .order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["vendor-bookings"] }); },
  });

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
                    <Button size="sm" onClick={() => setStatus.mutate({ id: b.id, status: "confirmed" })}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: b.id, status: "cancelled" })}>Decline</Button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <Button size="sm" onClick={() => setStatus.mutate({ id: b.id, status: "completed" })}>Mark done</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
