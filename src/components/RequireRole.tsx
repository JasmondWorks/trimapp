"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useRoles } from "@/hooks/useUser";

type Role = "customer" | "vendor" | "admin";

/**
 * Client-side replacement for the TanStack `beforeLoad` guards. The Supabase
 * session lives in browser storage, so the check can only run once mounted —
 * we render a spinner until roles resolve, then redirect if they don't match.
 */
export function RequireRole({
  anyOf,
  redirectTo,
  children,
}: {
  /** Omit to require only that someone is signed in. */
  anyOf?: Role[];
  /** Where to send users who are signed in but lack the role. */
  redirectTo: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, roles, loading } = useRoles();

  const allowed = !anyOf || roles.some((r) => anyOf.includes(r));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (!allowed) router.replace(redirectTo);
  }, [loading, user, allowed, redirectTo, router]);

  if (loading || !user || !allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
