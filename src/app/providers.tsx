"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { createQueryClient } from "@/lib/query-client";
import { useAuthBootstrap, useAuthCallback } from "@/models/auth/auth.hooks";
import { useCartSync } from "@/models/cart/cart.hooks";

/**
 * Mount-only side effects. All three need to sit inside QueryClientProvider,
 * and none of them render anything.
 */
function SessionAndCartMount() {
  // Runs on any route, because email links land wherever `emailRedirectTo`
  // pointed — including links already sitting in inboxes.
  const { isProcessing } = useAuthCallback();
  // Deferred until the callback resolves, so the two don't race to decide
  // whether the user is signed in.
  useAuthBootstrap({ enabled: !isProcessing });
  useCartSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  // Created once per browser session — never at module scope, so server
  // renders don't share a cache between requests.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionAndCartMount />
      {children}
      <Toaster position="top-right" theme="dark" />
    </QueryClientProvider>
  );
}
