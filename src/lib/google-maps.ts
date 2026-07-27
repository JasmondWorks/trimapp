// Loads the Google Maps JS API once. We keep it loosely typed to avoid
// pulling in @types/google.maps; consumers can cast when they need specifics.
type GoogleMapsNs = Record<string, unknown>;

let loaderPromise: Promise<GoogleMapsNs> | null = null;

declare global {
  interface Window {
    __trimappInitMap?: () => void;
    google?: { maps: GoogleMapsNs };
  }
}

export function loadGoogleMaps(): Promise<GoogleMapsNs> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    const channel = process.env.NEXT_PUBLIC_GOOGLE_MAPS_TRACKING_ID ?? "";
    if (!key) {
      reject(new Error("Google Maps browser key missing"));
      return;
    }
    window.__trimappInitMap = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps did not initialize"));
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__trimappInitMap${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}
