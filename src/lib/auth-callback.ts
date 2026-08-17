/**
 * Reading the tokens Supabase appends to the URL after an email link.
 *
 * Confirming an email, a magic link, or a password recovery all redirect back
 * with the session in the URL *fragment*:
 *
 *   /#access_token=…&refresh_token=…&expires_at=…&type=signup
 *
 * or, when the link has expired:
 *
 *   /#error=access_denied&error_code=otp_expired&error_description=…
 *
 * A fragment never reaches the server — it exists only in the browser — so it
 * has to be read client-side and exchanged for a real session. The tokens must
 * then be stripped from the URL immediately: a refresh token sitting in
 * `location.hash` ends up in browser history and is visible to anything that
 * can read the address bar.
 */

export interface AuthCallbackTokens {
  accessToken: string;
  refreshToken: string;
  /** `signup`, `magiclink`, `recovery`, `invite`… */
  type: string | null;
}

export interface AuthCallbackError {
  code: string | null;
  description: string;
}

export type AuthCallback =
  | { kind: "tokens"; tokens: AuthCallbackTokens }
  | { kind: "error"; error: AuthCallbackError }
  | null;

/**
 * Reads the fragment without modifying it.
 *
 * Deliberately pure: this runs in a `useState` initializer, which React may
 * invoke twice under StrictMode. Clearing here would make the second call
 * return nothing and silently drop the session.
 */
export function parseAuthCallback(): AuthCallback {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;

  const params = new URLSearchParams(hash);

  const error = params.get("error") ?? params.get("error_code");
  if (error) {
    return {
      kind: "error",
      error: {
        code: params.get("error_code") ?? params.get("error"),
        description:
          params.get("error_description")?.replace(/\+/g, " ") ??
          "That link is no longer valid.",
      },
    };
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;

  return {
    kind: "tokens",
    tokens: { accessToken, refreshToken, type: params.get("type") },
  };
}

/**
 * Removes the fragment from the address bar and from history, without adding
 * a navigation entry — so Back doesn't return the user to a URL containing
 * their refresh token.
 */
export function stripAuthCallback(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

/** Message shown once the session has been established, keyed by link type. */
export function callbackSuccessMessage(type: string | null): string {
  switch (type) {
    case "signup":
      return "Email confirmed — you're signed in.";
    case "recovery":
      return "Signed in. You can set a new password from your account.";
    case "invite":
      return "Invitation accepted — welcome.";
    default:
      return "Signed in.";
  }
}
