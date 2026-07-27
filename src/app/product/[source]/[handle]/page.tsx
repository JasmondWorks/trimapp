"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  storefrontApiRequest,
  PRODUCT_BY_HANDLE_QUERY,
  useCartStore,
} from "@/lib/shopify";
import { useVendorCart } from "@/stores/vendorCart";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default ProductDetail;

type ShopifyDetail = {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: { amount: string; currencyCode: string };
        availableForSale: boolean;
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  options: Array<{ name: string; values: string[] }>;
};

function ProductDetail() {
  const { source, handle } = useParams<{ source: string; handle: string }>();

  const shopifyQ = useQuery({
    enabled: source === "shopify",
    queryKey: ["shopify-product", handle],
    queryFn: async () => {
      const r = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
      return (r?.data?.product ?? null) as ShopifyDetail | null;
    },
  });

  const vendorQ = useQuery({
    enabled: source === "vendor",
    queryKey: ["vendor-product", handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_products")
        .select("*,vendors(business_name,commission_pct,id)")
        .eq("slug", handle)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const addShopify = useCartStore((s) => s.addItem);
  const addVendor = useVendorCart((s) => s.addItem);

  if (source === "shopify") {
    if (shopifyQ.isLoading)
      return (
        <>
          <SiteHeader />
          <div className="p-8 text-muted-foreground">Loading…</div>
        </>
      );
    const p = shopifyQ.data;
    if (!p)
      return (
        <>
          <SiteHeader />
          <div className="p-8">Product not found.</div>
        </>
      );
    const image = p.images.edges[0]?.node;
    const variant = p.variants.edges[0]?.node;
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {image && (
              <img
                src={image.url}
                alt={image.altText ?? p.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div>
            <Badge className="mb-3">
              <ShieldCheck className="h-3 w-3 mr-1" /> By TrimApp
            </Badge>
            <h1 className="font-display text-3xl mb-2">{p.title}</h1>
            <p className="text-primary text-2xl font-semibold mb-4">
              {p.priceRange.minVariantPrice.currencyCode}{" "}
              {parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}
            </p>
            <p className="text-muted-foreground mb-6 whitespace-pre-line">
              {p.description}
            </p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!variant}
              onClick={async () => {
                if (!variant) return;
                await addShopify({
                  product: {
                    node: {
                      ...p,
                      priceRange: p.priceRange,
                      images: p.images,
                      variants: p.variants,
                      options: p.options,
                    },
                  },
                  variantId: variant.id,
                  variantTitle: variant.title,
                  price: variant.price,
                  quantity: 1,
                  selectedOptions: variant.selectedOptions,
                });
                toast.success(`Added ${p.title}`);
              }}
            >
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (vendorQ.isLoading)
    return (
      <>
        <SiteHeader />
        <div className="p-8 text-muted-foreground">Loading…</div>
      </>
    );
  const p = vendorQ.data;
  if (!p)
    return (
      <>
        <SiteHeader />
        <div className="p-8">Product not found.</div>
      </>
    );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {p.images?.[0] && (
            <img
              src={p.images[0]}
              alt={p.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div>
          <Link href={`/vendors/${p.vendors?.id ?? ""}`}>
            <Badge variant="secondary" className="mb-3">
              By {p.vendors?.business_name ?? "Vendor"}
            </Badge>
          </Link>
          <h1 className="font-display text-3xl mb-2">{p.title}</h1>
          <p className="text-primary text-2xl font-semibold mb-4">
            {formatNaira(p.price_naira)}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            {p.stock} in stock
          </p>
          <p className="text-muted-foreground mb-6 whitespace-pre-line">
            {p.description}
          </p>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={p.stock <= 0}
            onClick={() => {
              addVendor({
                productId: p.id,
                vendorId: p.vendor_id,
                vendorName: p.vendors?.business_name ?? "Vendor",
                title: p.title,
                imageUrl: p.images?.[0] ?? null,
                unitPrice: p.price_naira,
                commissionPct: p.vendors?.commission_pct ?? 10,
              });
              toast.success(`Added ${p.title}`);
            }}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
