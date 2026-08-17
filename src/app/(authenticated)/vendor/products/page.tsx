"use client";


import { useState } from "react";
import { useManageProducts, useMyProducts } from "@/models/product/product.hooks";
import {
  DEFAULT_PRODUCT_CATEGORY,
  DEFAULT_PRODUCT_STOCK,
  PRODUCT_CATEGORY_LABELS,
} from "@/models/product/product.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default VendorProducts;

const EMPTY_PRODUCT_FORM = {
  title: "",
  price: "",
  stock: String(DEFAULT_PRODUCT_STOCK),
  category: DEFAULT_PRODUCT_CATEGORY as string,
  images: "",
  description: "",
};

function VendorProducts() {
  const { products } = useMyProducts();
  const { createProduct, deleteProduct, isSaving } = useManageProducts();

  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);

  const handleAdd = async () => {
    try {
      await createProduct({
        title: form.title,
        price_naira: form.price,
        stock: form.stock,
        category: form.category,
        images: form.images,
        description: form.description,
      });
      toast.success("Product added");
      setForm(EMPTY_PRODUCT_FORM);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

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
                <button onClick={() => void handleDelete(p.id)} aria-label="delete"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-sm">No products yet.</p>}
      </div>

      <form className="rounded-lg border border-border bg-card p-5 space-y-3 h-fit"
        onSubmit={(e) => { e.preventDefault(); void handleAdd(); }}>
        <h2 className="font-display text-xl">Add product</h2>
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Price (₦)</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          <div><Label>Stock</Label><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select></div>
        </div>
        <div><Label>Image URLs (one per line)</Label><Textarea rows={2} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://…" /></div>
        <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <Button type="submit" disabled={isSaving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">{isSaving ? "Adding…" : "Add product"}</Button>
      </form>
    </div>
  );
}
