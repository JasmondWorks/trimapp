"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { unwrap } from "@/lib/api";
import { emptyList } from "@/lib/empty";
import {
  callbackSuccessMessage,
  parseAuthCallback,
  stripAuthCallback,
} from "@/lib/auth-callback";
import { purgeLegacyAuthStorage } from "@/lib/legacy-storage";
import { tokenManager } from "@/lib/token-manager";
import { useAuthStore } from "@/stores/auth.store";

import {
  AUTH_QUERY_KEYS,
  PASSWORD_RESET_ROUTE,
  SESSION_STALE_TIME,
} from "./auth.constants";
import {
  completeOAuthSignIn,
  getCurrentUser,
  getRoles,
  grantRole,
  refreshSession,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "./auth.services";
import type {
  OAuthTokens,
  RequestPasswordResetInput,
  Role,
  SignInInput,
  SignUpInput,
  UpdatePasswordInput,
} from "./auth.types";

/**
 * Restores the session on mount.
 *
 * The access token only ever lived in memory, so a reload starts with nothing.
 * `refreshSession` trades the httpOnly refresh cookie for a fresh access token
 * and puts it back in the token manager. Mount this once, near the root.
 */
export function useAuthBootstrap({ enabled = true }: { enabled?: boolean } = {}) {
  const setUser = useAuthStore((s) => s.setUser);
  const setReady = useAuthStore((s) => s.setReady);
  const queryClient = useQueryClient();

  // Drop any session the old localStorage-backed client left behind. Runs
  // before anything reads storage, and is a no-op once there is nothing left.
  useEffect(() => {
    purgeLegacyAuthStorage();
  }, []);

  const query = useQuery({
    queryKey: AUTH_QUERY_KEYS.session(),
    queryFn: () => unwrap(refreshSession()),
    staleTime: SESSION_STALE_TIME,
    retry: false,
    // Held off while an email-link callback is still being exchanged, so we
    // don't briefly resolve "signed out" and flash a guest UI first.
    enabled,
  });

  const session = query.data;
  const settled = enabled && !query.isPending;

  useEffect(() => {
    if (!settled) return;
    if (session) {
      tokenManager.set(session.accessToken, session.expiresAt);
      setUser(session.user);
    } else {
      tokenManager.clear();
      setUser(null);
    }
    setReady(true);
    // The roles query is gated on the session, so nudge it once we have one.
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.roles() });
  }, [settled, session, setUser, setReady, queryClient]);

  return { isReady: settled };
}

export function useCurrentUser() {
  const isReady = useAuthStore((s) => s.isReady);
  const query = useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser(),
    queryFn: () => unwrap(getCurrentUser()),
    staleTime: SESSION_STALE_TIME,
  });

  return {
    user: query.data ?? null,
    // Stay "loading" until the bootstrap settles, so guards don't flash a
    // signed-out state during the first restore.
    isLoading: query.isPending || !isReady,
    error: query.error,
  };
}

export function useRoles() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const setRoles = useAuthStore((s) => s.setRoles);

  const query = useQuery({
    queryKey: AUTH_QUERY_KEYS.roles(),
    queryFn: () => unwrap(getRoles()),
    enabled: !!user,
    staleTime: SESSION_STALE_TIME,
  });

  const roles = query.data?.roles;

  useEffect(() => {
    setRoles(roles ?? emptyList());
  }, [roles, setRoles]);

  return {
    user,
    roles: roles ?? emptyList(),
    isAdmin: query.data?.isAdmin ?? false,
    isVendor: query.data?.isVendor ?? false,
    isLoading: userLoading || (!!user && query.isPending),
  };
}

export function useSignIn() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const mutation = useMutation({
    mutationFn: (input: SignInInput) => unwrap(signIn(input)),
    onSuccess: (session) => {
      tokenManager.set(session.accessToken, session.expiresAt);
      setUser(session.user);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
    },
  });

  return { signIn: mutation.mutateAsync, isSigningIn: mutation.isPending };
}

export function useSignUp() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const mutation = useMutation({
    mutationFn: (input: SignUpInput) => unwrap(signUp(input)),
    onSuccess: (session) => {
      // Null when email confirmation is required — no session yet.
      if (session) {
        tokenManager.set(session.accessToken, session.expiresAt);
        setUser(session.user);
      }
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
    },
  });

  return { signUp: mutation.mutateAsync, isSigningUp: mutation.isPending };
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.reset);

  const mutation = useMutation({
    mutationFn: () => unwrap(signOut()),
    onSuccess: () => {
      tokenManager.clear();
      reset();
      // Every cached query was scoped to the previous user.
      queryClient.clear();
    },
  });

  return { signOut: mutation.mutateAsync, isSigningOut: mutation.isPending };
}

export function useGrantRole() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (role: Role) => unwrap(grantRole(role)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.roles() }),
  });

  return { grantRole: mutation.mutateAsync, isGranting: mutation.isPending };
}

export function useRequestPasswordReset() {
  const mutation = useMutation({
    mutationFn: (input: RequestPasswordResetInput) => unwrap(requestPasswordReset(input)),
  });

  return { requestPasswordReset: mutation.mutateAsync, isSending: mutation.isPending };
}

export function useUpdatePassword() {
  const mutation = useMutation({
    mutationFn: (input: UpdatePasswordInput) => unwrap(updatePassword(input)),
  });

  return { updatePassword: mutation.mutateAsync, isUpdating: mutation.isPending };
}

/**
 * Completes a sign-in arriving via an email link.
 *
 * Confirming an email (also magic links and password recovery) redirects back
 * with the session in the URL fragment. Nothing on the server can see a
 * fragment, and since the browser no longer runs a Supabase client there is
 * nothing to consume it automatically — so without this the user lands on the
 * page still signed out, with a refresh token sitting in their address bar.
 *
 * The tokens are stripped from the URL first, then exchanged for an httpOnly
 * cookie by the same server action the OAuth flow uses.
 *
 * Mount once, near the root, alongside `useAuthBootstrap`.
 */
export function useAuthCallback() {
  // Read the fragment once, on first render, without touching it — this
  // initializer can run twice under StrictMode.
  const [callback] = useState(parseAuthCallback);
  const [isProcessing, setIsProcessing] = useState(callback?.kind === "tokens");
  const handled = useRef(false);

  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  useEffect(() => {
    if (!callback || handled.current) return;
    handled.current = true;

    // Out of the address bar and out of history before anything awaits.
    stripAuthCallback();

    if (callback.kind === "error") {
      toast.error(callback.error.description);
      return;
    }

    const { accessToken, refreshToken, type } = callback.tokens;
    void (async () => {
      try {
        const session = await unwrap(
          completeOAuthSignIn({ access_token: accessToken, refresh_token: refreshToken }),
        );
        tokenManager.set(session.accessToken, session.expiresAt);
        setUser(session.user);
        toast.success(callbackSuccessMessage(type));
        // A recovery link exists to change a password, so send them to the
        // form rather than dropping them wherever the link happened to land.
        if (type === "recovery") router.push(PASSWORD_RESET_ROUTE);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsProcessing(false);
        // Let the session/roles queries pick up the new cookie either way.
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
      }
    })();
  }, [callback, queryClient, setUser, router]);

  return { isProcessing };
}

/**
 * Finishes an OAuth sign-in. The tokens come from the provider in the browser
 * and are forwarded straight to the server — the browser keeps only the
 * access token, in memory.
 */
export function useCompleteOAuthSignIn() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const mutation = useMutation({
    mutationFn: (tokens: OAuthTokens) => unwrap(completeOAuthSignIn(tokens)),
    onSuccess: (session) => {
      tokenManager.set(session.accessToken, session.expiresAt);
      setUser(session.user);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
    },
  });

  return { completeOAuthSignIn: mutation.mutateAsync, isCompleting: mutation.isPending };
}
