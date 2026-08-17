"use client";


import { useAllVendors, useModerateVendor } from "@/models/vendor/vendor.hooks";
import type { VendorStatus } from "@/models/vendor/vendor.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default AdminVendors;

function AdminVendors() {
  const { vendors: data } = useAllVendors();
  const { setStatus, setVerified } = useModerateVendor();

  const handleStatus = async (id: string, status: VendorStatus) => {
    try {
      await setStatus({ id, status });
      toast.success("Updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleVerified = async (id: string, verified: boolean) => {
    try {
      await setVerified({ id, verified });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

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
              {v.status !== "approved" && <Button size="sm" onClick={() => void handleStatus(v.id, "approved")}>Approve</Button>}
              {v.status !== "suspended" && <Button size="sm" variant="outline" onClick={() => void handleStatus(v.id, "suspended")}>Suspend</Button>}
              <Button size="sm" variant="ghost" onClick={() => void handleVerified(v.id, !v.is_verified)}>
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
