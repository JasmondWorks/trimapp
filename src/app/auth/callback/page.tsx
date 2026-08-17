"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { StatusScreen } from "@/components/StatusScreen";
import { RETURN_TO_PARAM } from "@/lib/auth-routes";
import { POST_AUTH_REDIRECT } from "@/models/auth/auth.constants";
import { useCurrentUser } from "@/models/auth/auth.hooks";

/**
 * Landing page for email links (`emailRedirectTo` points here).
 *
 * The tokens arrive in the URL fragment and are consumed by `useAuthCallback`,
 * mounted once in Providers — this page deliberately does not read them, so
 * there is exactly one consumer and no race over who strips the fragment.
 * Its only job is to wait for the resulting session and route onward.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useCurrentUser();

  const returnTo = searchParams.get(RETURN_TO_PARAM) ?? POST_AUTH_REDIRECT;

  useEffect(() => {
    if (!isLoading && user) router.replace(returnTo);
  }, [isLoading, user, returnTo, router]);

  // Settled with no session: the link was expired, already used, or tampered
  // with. `useAuthCallback` has already explained which via a toast.
  if (!isLoading && !user) {
    return (
      <StatusScreen
        title="That link didn't work"
        description="It may have expired or already been used. Request a new one by signing in again."
        primaryAction={{ label: "Back to sign in", href: "/auth" }}
        secondaryAction={{ label: "Go home", href: "/" }}
      />
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Confirming your account…</p>
    </div>
  );
}
