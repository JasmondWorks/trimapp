const EMPTY: never[] = [];

/**
 * A single shared empty array.
 *
 * `query.data ?? []` looks harmless but allocates a new array on every render
 * while the query is loading, so any `useMemo`/`useEffect` depending on the
 * result re-runs each time. Returning one frozen-by-convention instance keeps
 * the identity stable.
 *
 * Typed as `never[]` so it is assignable to any element type without a type
 * argument at the call site. Never mutate the result.
 */
export function emptyList(): never[] {
  return EMPTY;
}
