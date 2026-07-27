"use client";


import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNaira, slugify } from "@/lib/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default VendorProducts;

function VendorProducts() {
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

  const { data: products } = useQuery({
    enabled: !!vendor?.id,
    queryKey: ["my-products", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase.from("vendor_products").select("*").eq("vendor_id", vendor!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [form, setForm] = useState({ title: "", price: "", stock: "10", category: "wigs", images: "", description: "" });

  const add = useMutation({
    mutationFn: async () => {
      if (!vendor) throw new Error("No vendor");
      const { error } = await supabase.from("vendor_products").insert({
        vendor_id: vendor.id,
        title: form.title,
        slug: slugify(form.title) + "-" + Math.random().toString(36).slice(2, 6),
        description: form.description || null,
        category: form.category,
        price_naira: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Product added"); setForm({ title: "", price: "", stock: "10", category: "wigs", images: "", description: "" }); qc.invalidateQueries({ queryKey: ["my-products"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-2xl mb-4">Your products</h1>
        {products?.length ? (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="rounded-md border border-border p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0">
                  {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{formatNaira(p.price_naira)} · {p.stock} in stock · {p.category}</p>
                </div>
                <button onClick={() => del.mutate(p.id)} aria-label="delete"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No products yet.</p>}
      </div>

      <form className="rounded-lg border border-border bg-card p-5 space-y-3 h-fit"
        onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
        <h2 className="font-display text-xl">Add product</h2>
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Price (₦)</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          <div><Label>Stock</Label><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wigs">Wigs</SelectItem>
                <SelectItem value="clippers">Clippers</SelectItem>
                <SelectItem value="trimmers">Trimmers</SelectItem>
                <SelectItem value="combs">Combs</SelectItem>
                <SelectItem value="capes">Capes</SelectItem>
                <SelectItem value="kits">Kits</SelectItem>
              </SelectContent>
            </Select></div>
        </div>
        <div><Label>Image URLs (one per line)</Label><Textarea rows={2} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://…" /></div>
        <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Add product</Button>
      </form>
    </div>
  );
}
