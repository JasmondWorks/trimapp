"use client";


import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NG_STATES } from "@/data/nigeria";
import { toast } from "sonner";

export default VendorProfileEdit;

function VendorProfileEdit() {
  const qc = useQueryClient();
  const { data: vendor } = useQuery({
    queryKey: ["me-vendor"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("vendors").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    business_name: "", bio: "", category: "barber" as "barber" | "hairdresser",
    address: "", city: "", state: "LA",
    latitude: "", longitude: "", phone: "",
    service_mode: "in_shop" as "in_shop" | "home" | "both",
    home_radius_km: "5", avatar_url: "", cover_url: "",
    portfolio_urls_text: "",
  });

  useEffect(() => {
    if (vendor) setForm({
      business_name: vendor.business_name,
      bio: vendor.bio ?? "",
      category: vendor.category,
      address: vendor.address ?? "",
      city: vendor.city ?? "",
      state: vendor.state ?? "LA",
      latitude: vendor.latitude?.toString() ?? "",
      longitude: vendor.longitude?.toString() ?? "",
      phone: vendor.phone ?? "",
      service_mode: vendor.service_mode,
      home_radius_km: vendor.home_radius_km?.toString() ?? "5",
      avatar_url: vendor.avatar_url ?? "",
      cover_url: vendor.cover_url ?? "",
      portfolio_urls_text: (vendor.portfolio_urls ?? []).join("\n"),
    });
  }, [vendor]);

  const save = useMutation({
    mutationFn: async () => {
      if (!vendor) throw new Error("No vendor");
      const { error } = await supabase.from("vendors").update({
        business_name: form.business_name,
        bio: form.bio || null,
        category: form.category,
        address: form.address || null,
        city: form.city || null,
        state: form.state,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        phone: form.phone || null,
        service_mode: form.service_mode,
        home_radius_km: parseFloat(form.home_radius_km || "5"),
        avatar_url: form.avatar_url || null,
        cover_url: form.cover_url || null,
        portfolio_urls: form.portfolio_urls_text.split("\n").map((s) => s.trim()).filter(Boolean),
      }).eq("id", vendor.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["me-vendor"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not available");
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() })),
      () => toast.error("Could not get location"),
    );
  };

  if (!vendor) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4 max-w-2xl">
      <h1 className="font-display text-2xl">Edit profile</h1>
      <div><Label>Business name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required /></div>
      <div><Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="barber">Barber</SelectItem><SelectItem value="hairdresser">Hairdresser</SelectItem></SelectContent>
        </Select></div>
      <div><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><Label>State</Label>
          <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{NG_STATES.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>
      <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-3 items-end">
        <div><Label>Latitude</Label><Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
        <div><Label>Longitude</Label><Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
        <Button type="button" variant="outline" onClick={useMyLocation}>Use my location</Button>
      </div>
      <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Service mode</Label>
          <Select value={form.service_mode} onValueChange={(v) => setForm({ ...form, service_mode: v as typeof form.service_mode })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in_shop">In-shop only</SelectItem>
              <SelectItem value="home">Home service only</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select></div>
        {form.service_mode !== "in_shop" && (
          <div><Label>Home radius (km)</Label><Input type="number" value={form.home_radius_km} onChange={(e) => setForm({ ...form, home_radius_km: e.target.value })} /></div>
        )}
      </div>
      <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" /></div>
      <div><Label>Cover URL</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" /></div>
      <div><Label>Portfolio image URLs (one per line)</Label><Textarea rows={4} value={form.portfolio_urls_text} onChange={(e) => setForm({ ...form, portfolio_urls_text: e.target.value })} /></div>
      <Button type="submit" disabled={save.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {save.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
