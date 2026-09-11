"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/media/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatNaira } from "@/lib/format";
import {
  DEFAULT_PRODUCT_CATEGORY,
  DEFAULT_PRODUCT_STOCK,
  PRODUCT_CATEGORY_LABELS,
} from "@/models/product/product.constants";
import { useManageProducts, useMyProducts } from "@/models/product/product.hooks";
import type { VendorProduct } from "@/models/product/product.types";
import { useMyVendor } from "@/models/vendor/vendor.hooks";

export default VendorProducts;

const EMPTY_PRODUCT_FORM = {
  title: "",
  price: "",
  stock: String(DEFAULT_PRODUCT_STOCK),
  category: DEFAULT_PRODUCT_CATEGORY as string,
  image: null as string | null,
  description: "",
};

type ProductForm = typeof EMPTY_PRODUCT_FORM;

function toForm(p: VendorProduct): ProductForm {
  return {
    title: p.title,
    price: String(p.price_naira),
    stock: String(p.stock),
    category: p.category,
    image: p.images?.[0] ?? null,
    description: p.description ?? "",
  };
}

function VendorProducts() {
  const { vendor } = useMyVendor();
  const { products } = useMyProducts();
  const { createProduct, updateProduct, deleteProduct, isSaving } = useManageProducts();

  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  // Null means the form is in "add" mode; an id switches it to editing that row.
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEditing = (p: VendorProduct) => {
    setEditingId(p.id);
    setForm(toForm(p));
  };

  const stopEditing = () => {
    setEditingId(null);
    setForm(EMPTY_PRODUCT_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // `images` is an array in the schema; the UI manages a single primary shot.
    const payload = {
      title: form.title,
      price_naira: form.price,
      stock: form.stock,
      category: form.category,
      images: form.image ? [form.image] : [],
      description: form.description,
    };

    try {
      if (editingId) {
        await updateProduct({ id: editingId, ...payload });
        toast.success("Product updated");
      } else {
        await createProduct(payload);
        toast.success("Product added");
      }
      stopEditing();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      // Deleting the row being edited would otherwise leave a form
      // pointing at something that no longer exists.
      if (editingId === id) stopEditing();
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
              <div
                key={p.id}
                className={`rounded-md border p-3 flex items-center gap-3 ${
                  editingId === p.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0">
                  {p.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNaira(p.price_naira)} · {p.stock} in stock · {p.category}
                  </p>
                </div>
                <button onClick={() => startEditing(p)} aria-label={`Edit ${p.title}`}>
                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
                <button onClick={() => void handleDelete(p.id)} aria-label={`Delete ${p.title}`}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No products yet.</p>
        )}
      </div>

      <form
        className="rounded-lg border border-border bg-card p-5 space-y-3 h-fit"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{editingId ? "Edit product" : "Add product"}</h2>
          {editingId && (
            <Button type="button" size="sm" variant="ghost" onClick={stopEditing}>
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
          )}
        </div>

        <div>
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Price (₦)</Label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Stock</Label>
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ImageUpload
          scope="vendors"
          ownerId={vendor?.id}
          label="Product image"
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
        />

        <div>
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? "Saving…" : editingId ? "Save changes" : "Add product"}
        </Button>
      </form>
    </div>
  );
}
