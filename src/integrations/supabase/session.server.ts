import "server-only";

import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { REFRESH_TOKEN_COOKIE, ROLES_COOKIE } from "@/lib/auth-routes";

import type { Database } from "./types";

/**
 * Server-side, user-scoped Supabase access for server actions.
 *
 * Two-token strategy:
 *   - refresh token → httpOnly, Secure, SameSite=Lax cookie (30 days). Never
 *     readable by JavaScript, so an XSS cannot exfiltrate a long-lived credential.
 *     This is the only credential stored anywhere on the client.
 *   - access token → in memory only, on both sides. The browser keeps its copy
 *     in `lib/token-manager.ts`; the server derives its own per request from
 *     the refresh cookie and never writes it down.
 *
 * Every client built here carries the *user's* JWT, so row-level security
 * applies exactly as it did when the browser talked to Supabase directly. The
 * service-role client in `client.server.ts` bypasses RLS and is only for
 * genuinely privileged work.
 */

export { REFRESH_TOKEN_COOKIE, ROLES_COOKIE };

const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/** Supabase's default JWT TTL, used only to estimate an expiry for the client. */
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Short-lived, in-process cache of resolved sessions, keyed by refresh token.
 *
 * Without an access-token cookie the server has to trade the refresh token for
 * a session on every action, and one page easily fires four actions at once.
 * Supabase's reuse interval makes that *correct* (concurrent refreshes return
 * the same token rather than failing) but it is still four network round trips.
 * This collapses them into one.
 *
 * Keyed on the refresh token, which only its owner holds, so entries cannot be
 * read across users. The TTL is far below the access token's own lifetime, and
 * sign-out evicts explicitly. On serverless this degrades to one refresh per
 * request, which is merely slower, not wrong.
 */
const SESSION_CACHE_TTL_MS = 30_000;
const SESSION_CACHE_MAX_ENTRIES = 500;

interface CachedSession {
  client: SupabaseClient<Database>;
  session: Session;
  cachedUntil: number;
}

const sessionCache = new Map<string, CachedSession>();

function readCache(refreshToken: string): CachedSession | null {
  const hit = sessionCache.get(refreshToken);
  if (!hit) return null;
  if (Date.now() > hit.cachedUntil) {
    sessionCache.delete(refreshToken);
    return null;
  }
  return hit;
}

function writeCache(keys: string[], entry: CachedSession): void {
  // Naive bound: drop the oldest insertion when full. Entries are cheap and
  // short-lived, so precision here buys nothing.
  if (sessionCache.size >= SESSION_CACHE_MAX_ENTRIES) {
    const oldest = sessionCache.keys().next().value;
    if (oldest) sessionCache.delete(oldest);
  }
  for (const key of keys) sessionCache.set(key, entry);
}

function evictFromCache(refreshToken: string): void {
  sessionCache.delete(refreshToken);
}

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function supabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) =>
        headers.set(key, value),
      );
    }
    // New-format keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function readEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(", ")}.`,
    );
  }
  return { url, key };
}

/** A fresh anon client — no session attached. Used for sign-in/sign-up. */
export function createAnonClient(): SupabaseClient<Database> {
  const { url, key } = readEnv();
  return createClient<Database>(url, key, {
    global: { fetch: supabaseFetch(key) },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix seconds. */
  expiresAt: number;
}

/**
 * Writes the token pair to httpOnly cookies. Callable only from a server action
 * or route handler — Next forbids cookie writes during render.
 */
export async function persistSession(session: Session): Promise<SessionTokens> {
  const store = await cookies();
  // The refresh token is the *only* credential written to the browser. The
  // access token is returned for the client to hold in memory and is never
  // persisted anywhere — no cookie, no storage.
  store.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt:
      session.expires_at ??
      Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
  };
}

/**
 * Mirrors the user's roles into an httpOnly cookie so the edge proxy can route
 * without a database round trip. Purely a routing hint — see `lib/auth-routes.ts`.
 */
export async function persistRoles(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;

  const roles = (data ?? []).map((row) => row.role as string);
  await writeRolesCookie(roles);
  return roles;
}

/**
 * Writes the roles cookie from rows the caller has *already* read.
 *
 * `persistRoles` does its own query, which is wasted work for a caller that
 * just selected the same rows — `getRoles` was querying `user_roles` twice per
 * call because of exactly that.
 */
export async function writeRolesCookie(roles: string[]): Promise<void> {
  const store = await cookies();
  store.set(ROLES_COOKIE, roles.join(","), {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Whether the proxy's routing hint is already present.
 *
 * The cookie lives as long as the refresh token, so it only needs rebuilding
 * when it is genuinely missing — after a manual clear, or a grant made outside
 * the app. Re-reading roles on every session restore is a query for nothing.
 */
export async function hasRolesCookie(): Promise<boolean> {
  const store = await cookies();
  return store.get(ROLES_COOKIE) !== undefined;
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  // Evict first: a cached session would otherwise outlive the sign-out for up
  // to the cache TTL.
  if (refreshToken) evictFromCache(refreshToken);
  store.delete(REFRESH_TOKEN_COOKIE);
  store.delete(ROLES_COOKIE);
}

/**
 * Rebuilds the caller's Supabase session from the refresh cookie alone.
 *
 * The refresh token is the only credential the browser holds, so the server
 * trades it for a fresh access token per request. Supabase rotates refresh
 * tokens on every exchange, but its reuse interval means concurrent exchanges
 * of the same token return the *same* new session rather than failing — so
 * several server actions firing at once is safe. The cache above collapses
 * them into a single round trip anyway.
 *
 * The rotated token is written back, but only when the caller is a server
 * action — hence the `persist` flag, since cookie writes throw during render.
 *
 * Returns `null` when there is no usable session; callers decide whether that
 * is an error or simply "signed out".
 */
export async function getServerSession(persist = true): Promise<{
  client: SupabaseClient<Database>;
  session: Session;
} | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;

  const cached = readCache(refreshToken);
  if (cached) return { client: cached.client, session: cached.session };

  const client = createAnonClient();
  const { data, error } = await client.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    evictFromCache(refreshToken);
    return null;
  }

  // Cache under both the token we were handed and the rotated one, so the
  // next request — which arrives carrying the new cookie — still hits.
  writeCache([refreshToken, data.session.refresh_token], {
    client,
    session: data.session,
    cachedUntil: Date.now() + SESSION_CACHE_TTL_MS,
  });

  if (persist && data.session.refresh_token !== refreshToken) {
    await persistSession(data.session);
  }
  return { client, session: data.session };
}

export class UnauthenticatedError extends Error {
  constructor(message = "You need to be signed in to do that.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

/** Session-or-throw, for actions that are meaningless without a user. */
export async function requireServerSession(persist = true) {
  const result = await getServerSession(persist);
  if (!result) throw new UnauthenticatedError();
  return { ...result, userId: result.session.user.id };
}

/**
 * Read-only Supabase client for anonymous/public data (approved vendors, the
 * product catalogue). Skips the session round trip entirely.
 */
export function getPublicClient(): SupabaseClient<Database> {
  return createAnonClient();
}
