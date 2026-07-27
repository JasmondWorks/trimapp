"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { useCartSync } from "@/hooks/useCartSync";

function CartSyncMount() {
  useCartSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  // Created once per browser session — never at module scope, so server
  // renders don't share a cache between requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartSyncMount />
      {children}
      <Toaster position="top-right" theme="dark" />
    </QueryClientProvider>
  );
}
