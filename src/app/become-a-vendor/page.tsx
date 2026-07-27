"use client";

import { useRouter } from 'next/navigation';
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NG_STATES } from "@/data/nigeria";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function BecomeVendor() {
  const { user } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "", bio: "",
    category: "barber" as "barber" | "hairdresser",
    address: "", city: "", state: "LA",
    phone: "",
    service_mode: "in_shop" as "in_shop" | "home" | "both",
    home_radius_km: "5",
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      const { error } = await supabase.from("vendors").insert({
        user_id: user.id,
        business_name: form.business_name,
        bio: form.bio || null,
        category: form.category,
        address: form.address || null,
        city: form.city || null,
        state: form.state,
        phone: form.phone || null,
        service_mode: form.service_mode,
        home_radius_km: parseFloat(form.home_radius_km || "5"),
        status: "pending",
      });
      if (error) throw error;
      await supabase.from("user_roles").insert({ user_id: user.id, role: "vendor" }).select();
    },
    onSuccess: () => {
      toast.success("Application submitted. We'll review and reach out.");
      router.push("/vendor");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <p className="text-primary text-xs tracking-[0.25em] uppercase mb-2">For barbers & hairdressers</p>
        <h1 className="font-display text-4xl mb-2">List your shop on TrimApp</h1>
        <p className="text-muted-foreground mb-8">
          Get discovered by customers near you and sell your own kits or wigs alongside your services.
        </p>

        {!user ? (
          <div className="rounded-lg border border-border p-6 text-center">
            <p className="mb-4">Sign in or create an account first.</p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href="/auth">Sign in</a>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); apply.mutate(); }}
            className="space-y-4 rounded-lg border border-border bg-card p-6"
          >
            <div>
              <Label>Business name</Label>
              <Input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="barber">Barber</SelectItem>
                  <SelectItem value="hairdresser">Hairdresser</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>About your shop</Label>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div>
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NG_STATES.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, area" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Service mode</Label>
                <Select value={form.service_mode} onValueChange={(v) => setForm({ ...form, service_mode: v as typeof form.service_mode })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_shop">In-shop only</SelectItem>
                    <SelectItem value="home">Home service only</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.service_mode !== "in_shop") && (
                <div><Label>Home service radius (km)</Label><Input type="number" min={1} value={form.home_radius_km} onChange={(e) => setForm({ ...form, home_radius_km: e.target.value })} /></div>
              )}
            </div>
            <Button type="submit" disabled={apply.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">You'll be able to fine-tune your profile after applying.</p>
          </form>
        )}
      </div>
    </div>
  );
}
