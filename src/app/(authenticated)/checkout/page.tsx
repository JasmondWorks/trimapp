"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/lib/shopify";
import { useVendorCart } from "@/stores/vendorCart";
import { formatNaira } from "@/lib/format";
import { NG_STATES } from "@/data/nigeria";
import { toast } from "sonner";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";

export default Checkout;

function Checkout() {
  const router = useRouter();
  const qc = useQueryClient();

  const vendorItems = useVendorCart((s) => s.items);
  const clearVendor = useVendorCart((s) => s.clearCart);
  const vendorTotal = useVendorCart((s) => s.totalNaira());

  const shopifyItems = useCartStore((s) => s.items);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const shopifyTotal = shopifyItems.reduce(
    (n, i) => n + parseFloat(i.price.amount) * i.quantity,
    0,
  );

  const { data: profile } = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "LA",
    notes: "",
  });
  if (profile && !form.name)
    setForm((f) => ({
      ...f,
      name: profile.full_name ?? "",
      phone: profile.phone ?? "",
    }));

  const placeVendorOrder = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      if (vendorItems.length === 0) throw new Error("No vendor items");
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: u.user.id,
          total_naira: vendorTotal,
          status: "awaiting_payment",
          delivery_name: form.name,
          delivery_phone: form.phone,
          delivery_address: form.address,
          delivery_city: form.city,
          delivery_state: form.state,
          notes: form.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const items = vendorItems.map((i) => ({
        order_id: order.id,
        source: "vendor" as const,
        vendor_product_id: i.productId,
        seller_vendor_id: i.vendorId,
        title: i.title,
        image_url: i.imageUrl,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        commission_amount: Math.round(
          (i.unitPrice * i.quantity * i.commissionPct) / 100,
        ),
      }));
      const { error: e2 } = await supabase.from("order_items").insert(items);
      if (e2) throw e2;
      return order.id;
    },
    onSuccess: () => {
      toast.success("Order saved — Paystack coming soon");
      clearVendor();
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      router.push("/orders");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const hasNothing = shopifyItems.length === 0 && vendorItems.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl mb-6">Checkout</h1>
        {hasNothing ? (
          <div className="rounded-lg border border-border p-10 text-center">
            <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
            <Button asChild>
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {vendorItems.length > 0 && (
              <section className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl">Vendor items</h2>
                  <span className="text-primary font-semibold">
                    {formatNaira(vendorTotal)}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {vendorItems.map((i) => (
                    <div
                      key={i.productId}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {i.title} × {i.quantity}{" "}
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                          By {i.vendorName}
                        </Badge>
                      </span>
                      <span>{formatNaira(i.unitPrice * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Recipient</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select
                      value={form.state}
                      onValueChange={(v) => setForm({ ...form, state: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NG_STATES.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-md bg-secondary/60 border border-border p-3 text-sm text-muted-foreground">
                  Paystack payments arrive in the next release. For now your
                  order is saved as “awaiting payment” and vendors are notified.
                </div>
                <Button
                  className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => placeVendorOrder.mutate()}
                  disabled={placeVendorOrder.isPending}
                >
                  {placeVendorOrder.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Place vendor order · ${formatNaira(vendorTotal)}`
                  )}
                </Button>
              </section>
            )}

            {shopifyItems.length > 0 && (
              <section className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl flex items-center gap-2">
                    TrimApp store{" "}
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </h2>
                  <span className="text-primary font-semibold">
                    {shopifyItems[0]?.price.currencyCode}{" "}
                    {shopifyTotal.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1 mb-4 text-sm">
                  {shopifyItems.map((i) => (
                    <div key={i.variantId} className="flex justify-between">
                      <span>
                        {i.product.node.title} × {i.quantity}
                      </span>
                      <span>
                        {i.price.currencyCode}{" "}
                        {(parseFloat(i.price.amount) * i.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!checkoutUrl}
                  onClick={() =>
                    checkoutUrl && window.open(checkoutUrl, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Checkout TrimApp
                  items
                </Button>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
