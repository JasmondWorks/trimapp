import { forbidden } from "next/navigation";

/**
 * Routable 403 — the proxy's redirect target for a signed-in user whose role does not cover the route.
 *
 * The proxy can only redirect, not raise an interrupt, so it sends users here
 * and this page calls `forbidden()` to render the `app/forbidden.tsx` boundary.
 *
 * Caveat on the status code: the root `app/loading.tsx` makes every route
 * stream, so the 200 shell is flushed before this interrupt is reached and the
 * response stays 200 even though the 403 screen renders. Removing the root
 * loading.tsx restores a real 403. Kept as-is because the streaming fallback
 * is worth more than the status code on a page only humans read — the actual
 * enforcement is the proxy redirect and RLS, not this number.
 */
export default function ForbiddenPage() {
  forbidden();
}
