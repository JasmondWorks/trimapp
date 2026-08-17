"use client";


import { useState } from "react";
import { useMyVendor, useUpdateMyVendor } from "@/models/vendor/vendor.hooks";
import {
  DEFAULT_HOME_RADIUS_KM,
  DEFAULT_SERVICE_MODE,
  DEFAULT_STATE_CODE,
  DEFAULT_VENDOR_CATEGORY,
  SERVICE_MODE_LABELS,
} from "@/models/vendor/vendor.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NG_STATES } from "@/data/nigeria";
import { toast } from "sonner";

export default VendorProfileEdit;

function VendorProfileEdit() {
  const { vendor } = useMyVendor();
  const { updateVendor, isSaving } = useUpdateMyVendor();

  const [form, setForm] = useState({
    business_name: "", bio: "", category: DEFAULT_VENDOR_CATEGORY as "barber" | "hairdresser",
    address: "", city: "", state: DEFAULT_STATE_CODE,
    latitude: "", longitude: "", phone: "",
    service_mode: DEFAULT_SERVICE_MODE as "in_shop" | "home" | "both",
    home_radius_km: String(DEFAULT_HOME_RADIUS_KM), avatar_url: "", cover_url: "",
    portfolio_urls_text: "",
  });

  // Seed once the vendor row arrives — see the note in /account for why this
  // adjusts state during render rather than in an effect.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (vendor && seededFor !== vendor.id) {
    setSeededFor(vendor.id);
    setForm({
      business_name: vendor.business_name,
      bio: vendor.bio ?? "",
      category: vendor.category,
      address: vendor.address ?? "",
      city: vendor.city ?? "",
      state: vendor.state ?? DEFAULT_STATE_CODE,
      latitude: vendor.latitude?.toString() ?? "",
      longitude: vendor.longitude?.toString() ?? "",
      phone: vendor.phone ?? "",
      service_mode: vendor.service_mode,
      home_radius_km: vendor.home_radius_km?.toString() ?? String(DEFAULT_HOME_RADIUS_KM),
      avatar_url: vendor.avatar_url ?? "",
      cover_url: vendor.cover_url ?? "",
      portfolio_urls_text: (vendor.portfolio_urls ?? []).join("\n"),
    });
  }

  const save = async () => {
    try {
      await updateVendor({
        ...form,
        portfolio_urls: form.portfolio_urls_text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      toast.success("Profile saved");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not available");
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() })),
      () => toast.error("Could not get location"),
    );
  };

  if (!vendor) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-4 max-w-2xl">
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
              {Object.entries(SERVICE_MODE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select></div>
        {form.service_mode !== "in_shop" && (
          <div><Label>Home radius (km)</Label><Input type="number" value={form.home_radius_km} onChange={(e) => setForm({ ...form, home_radius_km: e.target.value })} /></div>
        )}
      </div>
      <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" /></div>
      <div><Label>Cover URL</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" /></div>
      <div><Label>Portfolio image URLs (one per line)</Label><Textarea rows={4} value={form.portfolio_urls_text} onChange={(e) => setForm({ ...form, portfolio_urls_text: e.target.value })} /></div>
      <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
