import { Loader2 } from "lucide-react";

/**
 * Root-level suspense fallback. Shown while a route segment streams in — kept
 * deliberately plain so it reads as "still working", not as a broken page.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
