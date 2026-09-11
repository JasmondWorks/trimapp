import { useCallback, useSyncExternalStore } from "react";

import { GEO_CACHE_KEY } from "@/stores/cart.constants";

export type Coords = { lat: number; lng: number } | null;
export type GeoStatus = "idle" | "loading" | "granted" | "denied";

/**
 * The cached position, kept outside React.
 *
 * Reading localStorage straight from a `getSnapshot` would return a freshly
 * parsed object every call, which React compares by identity and treats as an
 * endless stream of changes. So the parsed value is held here and only
 * replaced when it genuinely changes.
 *
 * This also avoids the previous shape — a `useEffect` that called `setState`
 * synchronously on mount, which cascades an extra render before paint.
 */
interface GeoState {
  coords: Coords;
  status: GeoStatus;
}

let state: GeoState = { coords: null, status: "idle" };
let hydrated = false;
let listeners: Array<() => void> = [];

/** Server render has no localStorage; must be a stable reference. */
const SERVER_STATE: GeoState = { coords: null, status: "idle" };

function emit() {
  for (const l of listeners) l();
}

function setState(next: GeoState) {
  state = next;
  emit();
}

function persist(coords: { lat: number; lng: number }) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(coords));
  } catch {
    // Private browsing can refuse writes; the in-memory value still works.
  }
}

/**
 * Loads the cached position on first read rather than in an effect, so the
 * very first client render already has it and there is no flash of "no
 * location" followed by a re-render.
 */
function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (!cached) return;
    const parsed = JSON.parse(cached) as { lat: number; lng: number };
    if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") {
      state = { coords: parsed, status: "granted" };
    }
  } catch {
    // A corrupt entry should not break the page.
  }
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): GeoState {
  hydrateOnce();
  return state;
}

function getServerSnapshot(): GeoState {
  return SERVER_STATE;
}

export function useGeolocation() {
  const { coords, status } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ ...state, status: "denied" });
      return;
    }
    setState({ ...state, status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setState({ coords: next, status: "granted" });
        persist(next);
      },
      () => setState({ ...state, status: "denied" }),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  const setManual = useCallback((next: { lat: number; lng: number }) => {
    setState({ coords: next, status: "granted" });
    persist(next);
  }, []);

  return { coords, status, request, setManual };
}
