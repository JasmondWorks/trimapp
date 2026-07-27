"use client";


import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default VendorServices;

function VendorServices() {
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

  const { data: services } = useQuery({
    enabled: !!vendor?.id,
    queryKey: ["my-services", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("vendor_id", vendor!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [form, setForm] = useState({ name: "", price: "", duration: "30", description: "" });

  const add = useMutation({
    mutationFn: async () => {
      if (!vendor) throw new Error("No vendor");
      const { error } = await supabase.from("services").insert({
        vendor_id: vendor.id,
        name: form.name,
        price: parseFloat(form.price) || 0,
        duration_minutes: parseInt(form.duration) || 30,
        description: form.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Service added"); setForm({ name: "", price: "", duration: "30", description: "" }); qc.invalidateQueries({ queryKey: ["my-services"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-services"] }),
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h1 className="font-display text-2xl mb-4">Your services</h1>
        {services?.length ? (
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="rounded-md border border-border p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.duration_minutes} min · {formatNaira(s.price)}</p>
                </div>
                <button onClick={() => del.mutate(s.id)} aria-label="delete"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No services yet.</p>}
      </div>

      <form className="rounded-lg border border-border bg-card p-5 space-y-3 h-fit"
        onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
        <h2 className="font-display text-xl">Add service</h2>
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Price (₦)</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          <div><Label>Duration (min)</Label><Input type="number" min={5} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Add</Button>
      </form>
    </div>
  );
}
