"use client";


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default AdminVendors;

function AdminVendors() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved"|"pending"|"suspended" }) => {
      const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-vendors"] }); },
  });

  const setVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("vendors").update({ is_verified: verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-vendors"] }),
  });

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Vendors</h1>
      <div className="space-y-2">
        {(data ?? []).map((v) => (
          <div key={v.id} className="rounded-md border border-border p-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium flex items-center gap-1">{v.business_name} {v.is_verified && <ShieldCheck className="h-3 w-3 text-primary" />}</p>
              <p className="text-xs text-muted-foreground">{v.category} · {v.city ?? ""} {v.state ?? ""}</p>
            </div>
            <Badge variant={v.status === "approved" ? "default" : v.status === "pending" ? "secondary" : "destructive"} className="capitalize">{v.status}</Badge>
            <div className="flex gap-2">
              {v.status !== "approved" && <Button size="sm" onClick={() => setStatus.mutate({ id: v.id, status: "approved" })}>Approve</Button>}
              {v.status !== "suspended" && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: v.id, status: "suspended" })}>Suspend</Button>}
              <Button size="sm" variant="ghost" onClick={() => setVerified.mutate({ id: v.id, verified: !v.is_verified })}>
                {v.is_verified ? "Un-verify" : "Verify"}
              </Button>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-muted-foreground text-sm">No vendors yet.</p>}
      </div>
    </div>
  );
}
