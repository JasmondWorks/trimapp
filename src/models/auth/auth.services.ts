"use server";

import type { User } from "@supabase/supabase-js";

import {
  clearSessionCookies,
  createAnonClient,
  getServerSession,
  hasRolesCookie,
  persistRoles,
  persistSession,
  writeRolesCookie,
  requireServerSession,
} from "@/integrations/supabase/session.server";
import { failFrom, ok, type ApiResponse, type MessageResponse } from "@/lib/api";

import { AUTH_COLUMNS, AUTH_TABLES, ROLE_SELECT } from "./auth.constants";
import {
  oauthTokensSchema,
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./auth.schemas";
import type { AuthSession, AuthUser, Role, RolesResult } from "./auth.types";

/**
 * Auth server actions.
 *
 * Everything Supabase-facing happens here; the browser never imports
 * `@supabase/supabase-js`. Actions return `ApiResponse` envelopes rather than
 * throwing, because thrown errors are redacted to an opaque digest in
 * production builds.
 *
 * Note: a "use server" module may only export async functions — types,
 * constants and schemas live in the sibling files.
 */

function toAuthUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: typeof meta.full_name === "string" ? meta.full_name : null,
    avatarUrl: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
    createdAt: user.created_at,
  };
}

export async function signIn(input: unknown): Promise<ApiResponse<AuthSession>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid credentials");

  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) throw error;
    if (!data.session) return failFrom(null, "Sign-in did not return a session");

    const tokens = await persistSession(data.session);
    // The proxy reads roles from a cookie, so it has to be written before the
    // first navigation after sign-in.
    await persistRoles(supabase, data.session.user.id);
    return ok({
      user: toAuthUser(data.session.user),
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
    });
  } catch (error) {
    return failFrom(error, "Could not sign you in");
  }
}

export async function signUp(input: unknown): Promise<ApiResponse<AuthSession | null>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid details");

  try {
    const supabase = createAnonClient();
    const { fullName, email, password, emailRedirectTo } = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
        data: { full_name: fullName },
      },
    });
    if (error) throw error;

    // With email confirmation on, Supabase returns a user but no session.
    if (!data.session) {
      return ok(null, "Check your inbox to confirm your email.");
    }
    const tokens = await persistSession(data.session);
    await persistRoles(supabase, data.session.user.id);
    return ok({
      user: toAuthUser(data.session.user),
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
    });
  } catch (error) {
    return failFrom(error, "Could not create your account");
  }
}

/**
 * Completes an OAuth sign-in from tokens the browser received.
 *
 * The browser hands the pair straight here and keeps neither: the refresh
 * token becomes an httpOnly cookie and only the access token goes back, for
 * the in-memory token manager. `setSession` also validates the tokens against
 * Supabase, so a forged pair cannot mint a session.
 */
export async function completeOAuthSignIn(tokens: unknown): Promise<ApiResponse<AuthSession>> {
  const parsed = oauthTokensSchema.safeParse(tokens);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid sign-in response");

  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: parsed.data.access_token,
      refresh_token: parsed.data.refresh_token,
    });
    if (error) throw error;
    if (!data.session) return failFrom(null, "Sign-in did not return a session");

    const persisted = await persistSession(data.session);
    await persistRoles(supabase, data.session.user.id);
    return ok({
      user: toAuthUser(data.session.user),
      accessToken: persisted.accessToken,
      expiresAt: persisted.expiresAt,
    });
  } catch (error) {
    return failFrom(error, "Could not complete sign-in");
  }
}

export async function signOut(): Promise<ApiResponse<MessageResponse>> {
  try {
    const result = await getServerSession();
    if (result) await result.client.auth.signOut();
  } catch {
    // A failed remote sign-out must not strand the local cookies.
  }
  await clearSessionCookies();
  return ok({ message: "Signed out" });
}

/**
 * Rehydrates the in-memory access token after a page load, and is what the
 * axios interceptor calls on a 401. Returns `null` when signed out — an absent
 * session is a normal state, not an error.
 */
export async function refreshSession(): Promise<ApiResponse<AuthSession | null>> {
  try {
    const result = await getServerSession();
    if (!result) return ok(null);
    const tokens = await persistSession(result.session);
    // The roles cookie outlives individual sessions, so only rebuild it when
    // it has actually gone missing. `getRoles` refreshes it for free anyway.
    if (!(await hasRolesCookie())) {
      await persistRoles(result.client, result.session.user.id);
    }
    return ok({
      user: toAuthUser(result.session.user),
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
    });
  } catch (error) {
    return failFrom(error, "Could not restore your session");
  }
}

export async function getCurrentUser(): Promise<ApiResponse<AuthUser | null>> {
  try {
    const result = await getServerSession();
    if (!result) return ok(null);
    return ok(toAuthUser(result.session.user));
  } catch (error) {
    return failFrom(error, "Could not load your profile");
  }
}

export async function getRoles(): Promise<ApiResponse<RolesResult>> {
  const empty: RolesResult = { roles: [], isAdmin: false, isVendor: false };
  try {
    const result = await getServerSession();
    if (!result) return ok(empty);

    const { data, error } = await result.client
      .from(AUTH_TABLES.USER_ROLES)
      .select(ROLE_SELECT)
      .eq(AUTH_COLUMNS.USER_ID, result.session.user.id);
    if (error) throw error;

    const roles = (data ?? []).map((row) => row.role as Role);
    // Keep the proxy's routing hint in step, reusing the rows just read rather
    // than querying user_roles a second time.
    await writeRolesCookie(roles);
    return ok({
      roles,
      isAdmin: roles.includes("admin"),
      isVendor: roles.includes("vendor"),
    });
  } catch (error) {
    return failFrom(error, "Could not load your permissions");
  }
}

/** Grants the signed-in user a role. Used when a vendor application is filed. */
export async function grantRole(role: Role): Promise<ApiResponse<MessageResponse>> {
  try {
    const { client, userId } = await requireServerSession();
    const { error } = await client
      .from(AUTH_TABLES.USER_ROLES)
      .insert({ [AUTH_COLUMNS.USER_ID]: userId, [AUTH_COLUMNS.ROLE]: role });
    if (error) throw error;
    await persistRoles(client, userId);
    return ok({ message: `Granted ${role}` });
  } catch (error) {
    return failFrom(error, "Could not update your roles");
  }
}

/**
 * Sends a password-reset email.
 *
 * Always reports success, even for an address with no account: telling the
 * caller which emails are registered turns this into an account-enumeration
 * oracle.
 */
export async function requestPasswordReset(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Enter a valid email address");

  const sent = { message: "If that address has an account, a reset link is on its way." };
  try {
    const supabase = createAnonClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      ...(parsed.data.redirectTo ? { redirectTo: parsed.data.redirectTo } : {}),
    });
    // Log for us, but never differentiate in the response.
    if (error) console.error("[auth] resetPasswordForEmail:", error.message);
    return ok(sent);
  } catch (error) {
    console.error("[auth] resetPasswordForEmail threw:", error);
    return ok(sent);
  }
}

export async function updatePassword(input: unknown): Promise<ApiResponse<MessageResponse>> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) return failFrom(parsed.error.issues[0], "Invalid password");

  try {
    const { client } = await requireServerSession();
    const { error } = await client.auth.updateUser({ password: parsed.data.password });
    if (error) throw error;
    return ok({ message: "Password updated" });
  } catch (error) {
    return failFrom(error, "Could not update your password");
  }
}
