/**
 * In-memory access token store.
 *
 * The access token is deliberately NOT persisted — no localStorage, no
 * non-httpOnly cookie — so an XSS payload has nothing to read. It lives for the
 * lifetime of the JS context and is rehydrated after a reload by calling the
 * `refreshSession` server action, which reads the refresh token from an
 * httpOnly cookie the browser cannot touch.
 */

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
/** Unix seconds at which `accessToken` expires. */
let expiresAt = 0;
let listeners: Listener[] = [];

/** Refresh this many seconds before the token actually expires. */
const EXPIRY_SKEW_SECONDS = 30;

function notify() {
  for (const listener of listeners) listener(accessToken);
}

export const tokenManager = {
  get(): string | null {
    return accessToken;
  },

  set(token: string | null, expiresAtSeconds?: number | null): void {
    accessToken = token;
    expiresAt = token ? (expiresAtSeconds ?? 0) : 0;
    notify();
  },

  clear(): void {
    accessToken = null;
    expiresAt = 0;
    notify();
  },

  isExpired(): boolean {
    if (!accessToken) return true;
    if (!expiresAt) return false; // unknown expiry — let the 401 handler decide
    return Date.now() / 1000 >= expiresAt - EXPIRY_SKEW_SECONDS;
  },

  /** Subscribe to token changes; returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
