"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { NG_STATES } from "@/data/nigeria";
import { haversineKm } from "@/lib/format";
import { loadGoogleMaps } from "@/lib/google-maps";
import { MapPin, Star, ShieldCheck, LayoutGrid, Map as MapIcon } from "lucide-react";

type Vendor = {
  id: string;
  business_name: string;
  category: "barber" | "hairdresser";
  city: string | null;
  state: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  service_mode: "in_shop" | "home" | "both";
  is_verified: boolean;
  rating: number;
  reviews_count: number;
  avatar_url: string | null;
  cover_url: string | null;
};

export default function DiscoverPage() {
  const { coords, status, request, setManual } = useGeolocation();
  const [view, setView] = useState<"list" | "map">("list");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "barber" | "hairdresser">("all");
  const [radius, setRadius] = useState<string>("50");

  const { data, isLoading } = useQuery({
    queryKey: ["vendors-approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id,business_name,category,city,state,address,latitude,longitude,service_mode,is_verified,rating,reviews_count,avatar_url,cover_url")
        .eq("status", "approved")
        .limit(200);
      if (error) throw error;
      return data as Vendor[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [] as Array<Vendor & { distanceKm: number | null }>;
    const q = query.trim().toLowerCase();
    const list = data
      .filter((v) => (category === "all" ? true : v.category === category))
      .filter((v) =>
        q ? [v.business_name, v.city, v.state, v.address].some((x) => (x ?? "").toLowerCase().includes(q)) : true,
      )
      .map((v) => ({
        ...v,
        distanceKm: coords && v.latitude && v.longitude ? haversineKm(coords, { lat: v.latitude, lng: v.longitude }) : null,
      }));
    const r = parseFloat(radius);
    const withinRadius = Number.isFinite(r) && r > 0 && coords
      ? list.filter((v) => v.distanceKm === null || v.distanceKm <= r)
      : list;
    return withinRadius.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return b.rating - a.rating;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [data, query, category, coords, radius]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <p className="text-primary text-xs tracking-[0.25em] uppercase mb-2">Discover</p>
            <h1 className="font-display text-3xl sm:text-4xl">Salons near you</h1>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
              <LayoutGrid className="h-4 w-4 mr-2" /> List
            </Button>
            <Button variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}>
              <MapIcon className="h-4 w-4 mr-2" /> Map
            </Button>
          </div>
        </div>

        {/* Location bar */}
        <div className="rounded-lg border border-border bg-card p-4 mb-6 flex flex-wrap items-center gap-3">
          <MapPin className="h-4 w-4 text-primary" />
          {coords ? (
            <span className="text-sm">
              Using your location <span className="text-muted-foreground">({coords.lat.toFixed(3)}, {coords.lng.toFixed(3)})</span>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Set your location to sort by distance.</span>
          )}
          <Button size="sm" variant="outline" onClick={request} disabled={status === "loading"}>
            {status === "loading" ? "Locating…" : coords ? "Update" : "Use my location"}
          </Button>
          <Select onValueChange={(code) => {
            const s = NG_STATES.find((x) => x.code === code);
            if (s) setManual(s.capital);
          }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="or pick a state" /></SelectTrigger>
            <SelectContent>
              {NG_STATES.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Input placeholder="Search salon, city…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="barber">Barbers</SelectItem>
              <SelectItem value="hairdresser">Hairdressers</SelectItem>
            </SelectContent>
          </Select>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Within 2 km</SelectItem>
              <SelectItem value="5">Within 5 km</SelectItem>
              <SelectItem value="10">Within 10 km</SelectItem>
              <SelectItem value="50">Within 50 km</SelectItem>
              <SelectItem value="9999">Any distance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading vendors…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
            No approved vendors yet. Once vendors sign up and are approved, they'll appear here.
          </div>
        ) : view === "list" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <Link key={v.id} href={`/vendors/${v.id}`}
                className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors">
                <div className="aspect-[16/9] bg-muted overflow-hidden">
                  {v.cover_url ? <img src={v.cover_url} alt={v.business_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="h-full w-full flex items-center justify-center text-muted-foreground">No photo</div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-xl">{v.business_name}</h3>
                    {v.is_verified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-label="Verified" />}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="capitalize">{v.category}</Badge>
                    {v.city && <span>{v.city}{v.state ? `, ${v.state}` : ""}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" /> {v.rating.toFixed(1)} <span className="text-muted-foreground">({v.reviews_count})</span></span>
                    {v.distanceKm !== null && <span className="text-primary font-medium">{v.distanceKm.toFixed(1)} km</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <MapView vendors={filtered} center={coords ?? { lat: 9.082, lng: 8.6753 }} />
        )}
      </div>
    </div>
  );
}

function MapView({ vendors, center }: { vendors: Array<Vendor & { distanceKm: number | null }>; center: { lat: number; lng: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        const MapCtor = (maps as { Map: new (...args: unknown[]) => unknown }).Map;
        const MarkerCtor = (maps as { Marker: new (opts: unknown) => unknown }).Marker;
        const map = new MapCtor(ref.current, { center, zoom: coordsAreDefault(center) ? 6 : 12 });
        vendors.forEach((v) => {
          if (v.latitude && v.longitude) {
            new MarkerCtor({ position: { lat: v.latitude, lng: v.longitude }, map, title: v.business_name });
          }
        });
      })
      .catch((e) => setError(e.message ?? "Map failed to load"));
    return () => { cancelled = true; };
  }, [vendors, center]);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {error && <div className="p-4 text-sm text-destructive">{error}</div>}
      <div ref={ref} className="h-[540px] w-full bg-muted" />
    </div>
  );
}

function coordsAreDefault(c: { lat: number; lng: number }) {
  return Math.abs(c.lat - 9.082) < 0.01 && Math.abs(c.lng - 8.6753) < 0.01;
}
