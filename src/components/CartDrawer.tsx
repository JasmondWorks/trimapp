"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/shopify";
import { useVendorCart } from "@/stores/vendorCart";
import { formatNaira } from "@/lib/format";
import Link from "next/link";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const shopifyItems = useCartStore((s) => s.items);
  const updateShopify = useCartStore((s) => s.updateQuantity);
  const removeShopify = useCartStore((s) => s.removeItem);

  const vendorItems = useVendorCart((s) => s.items);
  const updateVendor = useVendorCart((s) => s.updateQuantity);
  const removeVendor = useVendorCart((s) => s.removeItem);

  const total =
    shopifyItems.reduce((s, i) => s + i.quantity, 0) +
    vendorItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {total > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {total}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your bag</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pt-4 space-y-6 min-h-0">
          {total === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Your bag is empty.</p>
            </div>
          )}

          {vendorItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Vendor items
              </p>
              {vendorItems.map((i) => (
                <div
                  key={i.productId}
                  className="flex gap-3 p-3 border border-border rounded-md"
                >
                  <div className="w-14 h-14 bg-muted rounded overflow-hidden shrink-0">
                    {i.imageUrl && (
                      <img
                        src={i.imageUrl}
                        alt={i.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{i.title}</p>
                    <p className="text-xs text-muted-foreground">
                      By {i.vendorName}
                    </p>
                    <p className="text-primary font-semibold">
                      {formatNaira(i.unitPrice)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => removeVendor(i.productId)}
                      aria-label="remove"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateVendor(i.productId, i.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">
                        {i.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateVendor(i.productId, i.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {shopifyItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                TrimApp store
              </p>
              {shopifyItems.map((i) => (
                <div
                  key={i.variantId}
                  className="flex gap-3 p-3 border border-border rounded-md"
                >
                  <div className="w-14 h-14 bg-muted rounded overflow-hidden shrink-0">
                    {i.product.node.images?.edges?.[0]?.node && (
                      <img
                        src={i.product.node.images.edges[0].node.url}
                        alt={i.product.node.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {i.product.node.title}
                    </p>
                    <p className="text-xs text-muted-foreground">By TrimApp</p>
                    <p className="text-primary font-semibold">
                      {i.price.currencyCode}{" "}
                      {parseFloat(i.price.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => removeShopify(i.variantId)}
                      aria-label="remove"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateShopify(i.variantId, i.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">
                        {i.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateShopify(i.variantId, i.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="pt-4 border-t border-border">
            <Button
              asChild
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={() => setOpen(false)}
            >
              <Link href="/checkout">Review & checkout</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
