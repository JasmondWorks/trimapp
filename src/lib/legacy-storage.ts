/**
 * One-time purge of auth data left in localStorage by the old client.
 *
 * Before the move to server actions, the browser Supabase client persisted the
 * whole session — access *and* refresh token — under `sb-<ref>-auth-token`.
 * Nothing writes those keys any more, but anyone who used the app before the
 * change still has a long-lived refresh token sitting in storage where a
 * single XSS could read it. Clearing it is the point of the exercise, so this
 * runs on every boot rather than being gated behind a version flag.
 */

/** Supabase's own key format, plus the older `supabase.auth.token` name. */
const LEGACY_KEY_PATTERNS = [/^sb-.*-auth-token(\.\d+)?$/, /^supabase\.auth\.token$/];

export function purgeLegacyAuthStorage(): string[] {
  if (typeof window === "undefined") return [];

  const purged: string[] = [];
  try {
    for (const store of [window.localStorage, window.sessionStorage]) {
      // Collect first — removing while iterating by index skips entries.
      const doomed = Object.keys(store).filter((key) =>
        LEGACY_KEY_PATTERNS.some((pattern) => pattern.test(key)),
      );
      for (const key of doomed) {
        store.removeItem(key);
        purged.push(key);
      }
    }
  } catch {
    // Storage can throw in private-browsing modes. Nothing here is essential.
  }
  return purged;
}
