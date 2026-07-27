import { useEffect, useState } from "react";

const KEY = "trimapp:coords";

export type Coords = { lat: number; lng: number } | null;

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem(KEY);
    if (cached) {
      try {
        setCoords(JSON.parse(cached));
        setStatus("granted");
      } catch {
        /* noop */
      }
    }
  }, []);

  const request = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus("granted");
        localStorage.setItem(KEY, JSON.stringify(c));
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const setManual = (c: { lat: number; lng: number }) => {
    setCoords(c);
    setStatus("granted");
    localStorage.setItem(KEY, JSON.stringify(c));
  };

  return { coords, status, request, setManual };
}
