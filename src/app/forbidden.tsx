import { StatusScreen } from "@/components/StatusScreen";

/**
 * 403 boundary — rendered when a server component calls `forbidden()`.
 *
 * Distinct from `unauthorized.tsx` on purpose: this user *is* signed in, their
 * role just doesn't cover this route. Telling them to sign in again would send
 * them in a circle, so the action here is to go somewhere they can actually use.
 */
export default function Forbidden() {
  return (
    <StatusScreen
      code="403"
      title="You don't have access to this"
      description="Your account doesn't have permission for this area. If you think that's wrong, get in touch with the TrimApp team."
      primaryAction={{ label: "Back to discover", href: "/discover" }}
      secondaryAction={{ label: "Your account", href: "/account" }}
    />
  );
}
