"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useRoles } from "@/models/auth/auth.hooks";
import { SIGN_IN_ROUTE } from "@/models/auth/auth.constants";
import type { Role } from "@/models/auth/auth.types";

/**
 * Client-side route guard.
 *
 * The session is restored from an httpOnly cookie on mount, so the check can
 * only run once mounted — we render a spinner until roles resolve, then
 * redirect if they don't match. `useRoles` reports loading until the session
 * bootstrap settles, which is what stops a signed-in user being bounced to
 * /auth on a hard refresh.
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
  const { user, roles, isLoading: loading } = useRoles();

  const allowed = !anyOf || roles.some((r) => anyOf.includes(r));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(SIGN_IN_ROUTE);
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
