/**
 * Route access policy, shared by the edge proxy and the client-side guards.
 *
 * This module must stay dependency-free — `proxy.ts` runs on the edge runtime,
 * where importing the Supabase client or anything marked `server-only` would
 * fail to bundle.
 */

/**
 * The only credential ever written to the browser.
 *
 * There is deliberately no access-token cookie: the access token lives solely
 * in memory on the client (`lib/token-manager.ts`), and the server derives its
 * own short-lived one from this refresh token per request.
 */
export const REFRESH_TOKEN_COOKIE = "trimapp_rt";
/**
 * Roles, comma-separated, in an httpOnly cookie written alongside the tokens.
 *
 * The proxy needs roles to route, and a database round trip on every
 * navigation would be too expensive. This cookie is a *routing hint* only —
 * it decides which page HTML gets served, never what data comes back. Every
 * read and write still goes through RLS with the user's own JWT, so a forged
 * cookie buys an attacker an empty admin page and nothing else.
 */
export const ROLES_COOKIE = "trimapp_roles";

export type AccessRole = "guest" | "customer" | "vendor" | "admin";

/** Reachable by anyone, signed in or not. */
export const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/discover",
  "/shop",
  "/vendors",
  "/product",
  "/become-a-vendor",
  "/unauthorized",
  "/forbidden",
] as const;

export const AUTH_CALLBACK_PATH = "/auth/callback";
export const PASSWORD_RESET_PATH = "/auth/reset-password";

const CUSTOMER_ROUTES = ["/account", "/bookings", "/orders", "/checkout"] as const;
const VENDOR_ROUTES = ["/vendor"] as const;
const ADMIN_ROUTES = ["/admin"] as const;

/**
 * Allowed route prefixes per role. Each role inherits the one below it, which
 * is why an admin can still reach the customer-facing checkout.
 */
export const ROLE_ACCESS_MAP: Record<AccessRole, readonly string[]> = {
  guest: PUBLIC_ROUTES,
  customer: [...PUBLIC_ROUTES, ...CUSTOMER_ROUTES],
  vendor: [...PUBLIC_ROUTES, ...CUSTOMER_ROUTES, ...VENDOR_ROUTES],
  admin: [...PUBLIC_ROUTES, ...CUSTOMER_ROUTES, ...VENDOR_ROUTES, ...ADMIN_ROUTES],
};

/**
 * Every route the map governs.
 *
 * A path outside this list is not "denied to everyone" — it's simply not ours
 * to police, and is handed to Next so an unknown URL still renders the 404
 * page instead of being bounced to sign-in.
 */
const PROTECTED_ROUTES = [...CUSTOMER_ROUTES, ...VENDOR_ROUTES, ...ADMIN_ROUTES] as const;

/**
 * Signed-in users have no business here — they get sent onward instead.
 *
 * Matched exactly, not by prefix: `/auth/callback` and `/auth/reset-password`
 * are reached *while* signing in, so bouncing them would break the very flow
 * that lands there.
 */
export const GUEST_ONLY_ROUTES = ["/auth"] as const;

export const SIGN_IN_PATH = "/auth";
export const SIGNED_IN_HOME = "/discover";
export const FORBIDDEN_PATH = "/forbidden";
export const UNAUTHORIZED_PATH = "/unauthorized";
/** Query param carrying where to return after signing in. */
export const RETURN_TO_PARAM = "next";

/** Most privileged role wins — a vendor who is also an admin gets admin. */
const ROLE_PRECEDENCE: AccessRole[] = ["admin", "vendor", "customer"];

/**
 * A signed-in user with no role row is still a customer: the role table grants
 * elevation, it isn't a prerequisite for having an account.
 */
export function resolveAccessRole(roles: string[]): AccessRole {
  return ROLE_PRECEDENCE.find((role) => roles.includes(role)) ?? "customer";
}

/**
 * Prefix match on whole segments: `/vendor` covers `/vendor/orders` but must
 * not swallow `/vendors/123`, which is a different, public route.
 */
export function matchesRoute(pathname: string, route: string): boolean {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isRouteAllowed(pathname: string, role: AccessRole): boolean {
  if (!isProtectedRoute(pathname)) return true;
  return ROLE_ACCESS_MAP[role].some((route) => matchesRoute(pathname, route));
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some((route) => pathname === route);
}

export function parseRolesCookie(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}
