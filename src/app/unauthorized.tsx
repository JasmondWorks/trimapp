import { StatusScreen } from "@/components/StatusScreen";

/**
 * 401 boundary — rendered when a server component calls `unauthorized()` from
 * `next/navigation` (enabled by `experimental.authInterrupts`).
 *
 * "Unauthorized" means *not signed in, or signed in without a usable identity*.
 * If the user is signed in and simply lacks the role, that is 403 — see
 * `forbidden.tsx`.
 */
export default function Unauthorized() {
  return (
    <StatusScreen
      code="401"
      title="You need to sign in"
      description="This page is only available to signed-in accounts. Sign in and we'll bring you straight back."
      primaryAction={{ label: "Sign in", href: "/auth" }}
      secondaryAction={{ label: "Go home", href: "/" }}
    />
  );
}
