"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  storefrontApiRequest,
  STOREFRONT_QUERY,
  type ShopifyProduct,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/shopifyCart.store";
import { useVendorCart } from "@/stores/vendorCart.store";
import { useShopProducts } from "@/models/product/product.hooks";
import {
  PRODUCT_CATEGORY_LABELS,
  SHOPIFY_PRODUCT_LIMIT,
} from "@/models/product/product.constants";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function ShopPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sellerFilter, setSellerFilter] = useState<
    "all" | "trimapp" | "vendor"
  >("all");

  const shopify = useQuery({
    queryKey: ["shopify-products-all"],
    queryFn: async () => {
      const r = await storefrontApiRequest(STOREFRONT_QUERY, {
        first: SHOPIFY_PRODUCT_LIMIT,
        query: null,
      });
      return (r?.data?.products?.edges ?? []) as ShopifyProduct[];
    },
  });

  const vendorProducts = useShopProducts();

  const addShopify = useCartStore((s) => s.addItem);
  const addVendor = useVendorCart((s) => s.addItem);

  const merged = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shopifyCards = (shopify.data ?? [])
      .filter(() => sellerFilter !== "vendor")
      .map((p) => ({
        key: `s:${p.node.id}`,
        source: "shopify" as const,
        title: p.node.title,
        priceLabel: `${p.node.priceRange.minVariantPrice.currencyCode} ${parseFloat(p.node.priceRange.minVariantPrice.amount).toFixed(2)}`,
        image: p.node.images.edges[0]?.node.url ?? null,
        handle: p.node.handle,
        category: "kit",
        sellerLabel: "TrimApp",
        raw: p,
      }));
    const vendorCards = vendorProducts.products
      .filter(() => sellerFilter !== "trimapp")
      .map((p) => ({
        key: `v:${p.id}`,
        source: "vendor" as const,
        title: p.title,
        priceLabel: formatNaira(p.price_naira),
        image: p.images[0] ?? null,
        handle: p.slug,
        category: p.category,
        sellerLabel: p.vendors?.business_name ?? "Vendor",
        raw: p,
      }));
    const combined = [...shopifyCards, ...vendorCards];
    return combined
      .filter((c) => (category === "all" ? true : c.category === category))
      .filter((c) =>
        q
          ? [c.title, c.sellerLabel].some((x) => x.toLowerCase().includes(q))
          : true,
      );
  }, [shopify.data, vendorProducts.products, query, category, sellerFilter]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <p className="text-primary text-xs tracking-[0.25em] uppercase mb-2">
          Shop
        </p>
        <h1 className="font-display text-4xl mb-2">Wigs & barbering kits</h1>
        <p className="text-muted-foreground mb-8 max-w-xl">
          Everything from clippers to premium wigs — from TrimApp and
          independent vendors.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <Input
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sellerFilter}
            onValueChange={(v) => setSellerFilter(v as typeof sellerFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sellers</SelectItem>
              <SelectItem value="trimapp">TrimApp only</SelectItem>
              <SelectItem value="vendor">Vendors only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {shopify.isLoading || vendorProducts.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : merged.length === 0 ? (
          <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
            No products found.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {merged.map((c) => (
              <div
                key={c.key}
                className="rounded-lg border border-border bg-card overflow-hidden group"
              >
                <Link
                  href={`/product/${c.source}/${c.handle}`}
                  className="block"
                >
                  <div className="aspect-square bg-muted overflow-hidden">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Badge
                      variant={c.source === "shopify" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {c.source === "shopify" && (
                        <ShieldCheck className="h-3 w-3 mr-1" />
                      )}
                      By {c.sellerLabel}
                    </Badge>
                  </div>
                  <Link
                    href={`/product/${c.source}/${c.handle}`}
                  >
                    <h3 className="font-medium mb-1 group-hover:text-primary">
                      {c.title}
                    </h3>
                  </Link>
                  <p className="text-primary font-semibold mb-3">
                    {c.priceLabel}
                  </p>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={async () => {
                      if (c.source === "shopify") {
                        const variant = c.raw.node.variants.edges[0]?.node;
                        if (!variant) return;
                        await addShopify({
                          product: c.raw,
                          variantId: variant.id,
                          variantTitle: variant.title,
                          price: variant.price,
                          quantity: 1,
                          selectedOptions: variant.selectedOptions,
                        });
                      } else {
                        addVendor({
                          productId: c.raw.id,
                          vendorId: c.raw.vendor_id,
                          vendorName: c.raw.vendors?.business_name ?? "Vendor",
                          title: c.raw.title,
                          imageUrl: c.raw.images[0] ?? null,
                          unitPrice: c.raw.price_naira,
                          commissionPct: c.raw.vendors?.commission_pct ?? 10,
                        });
                      }
                      toast.success(`Added ${c.title}`);
                    }}
                  >
                    Add to cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
