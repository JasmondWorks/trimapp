import { unauthorized } from "next/navigation";

/**
 * Routable 401 — a routable entry point for the 401 screen.
 *
 * The proxy can only redirect, not raise an interrupt, so it sends users here
 * and this page calls `unauthorized()` to render the `app/unauthorized.tsx` boundary.
 *
 * Caveat on the status code: the root `app/loading.tsx` makes every route
 * stream, so the 200 shell is flushed before this interrupt is reached and the
 * response stays 200 even though the 401 screen renders. Removing the root
 * loading.tsx restores a real 401. Kept as-is because the streaming fallback
 * is worth more than the status code on a page only humans read — the actual
 * enforcement is the proxy redirect and RLS, not this number.
 */
export default function UnauthorizedPage() {
  unauthorized();
}
