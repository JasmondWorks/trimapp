import { NextResponse, type NextRequest } from "next/server";

import {
  FORBIDDEN_PATH,
  isGuestOnlyRoute,
  isRouteAllowed,
  parseRolesCookie,
  REFRESH_TOKEN_COOKIE,
  resolveAccessRole,
  RETURN_TO_PARAM,
  ROLES_COOKIE,
  SIGN_IN_PATH,
  SIGNED_IN_HOME,
} from "@/lib/auth-routes";

/**
 * Route guard (Next 16's `proxy.ts`, formerly `middleware.ts`).
 *
 * Decides *before the page is served* whether the caller may see it, using the
 * role access map in `lib/auth-routes.ts`. Three outcomes:
 *
 *   - guest hitting a protected route → /auth, with `?next=` so they land back
 *     where they were headed;
 *   - signed-in user hitting a route their role doesn't cover → /forbidden;
 *   - signed-in user hitting a guest-only route (/auth) → /discover.
 *
 * This is defence in depth, not the last line: it reads an httpOnly roles
 * cookie rather than verifying a JWT, so it decides which HTML to ship, not
 * which rows come back. Data access is still gated by RLS with the user's own
 * token inside the server actions, and the `RequireRole` client guard keeps
 * client-side navigations honest.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // A refresh token is the durable half of the session; the access cookie may
  // legitimately have expired and be waiting to be refreshed.
  const isSignedIn = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);
  const roles = parseRolesCookie(request.cookies.get(ROLES_COOKIE)?.value);
  const role = isSignedIn ? resolveAccessRole(roles) : "guest";

  if (isSignedIn && isGuestOnlyRoute(pathname)) {
    return NextResponse.redirect(new URL(SIGNED_IN_HOME, request.url));
  }

  if (isRouteAllowed(pathname, role)) return NextResponse.next();

  if (!isSignedIn) {
    const signIn = new URL(SIGN_IN_PATH, request.url);
    signIn.searchParams.set(RETURN_TO_PARAM, `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }

  // Signed in, but this route is not in their role's allowlist. That is 403,
  // not 401 — sending them back to sign in would just loop them.
  return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.url));
}

export const config = {
  /**
   * Everything except Next internals, the favicon and static assets — those
   * would only burn edge invocations.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
