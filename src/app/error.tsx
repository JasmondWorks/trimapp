"use client";

import { useEffect } from "react";

import { StatusScreen } from "@/components/StatusScreen";
import { reportLovableError } from "@/lib/lovable-error-reporting";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "app_root_error_boundary" });
  }, [error]);

  return (
    <StatusScreen
      title="This page didn't load"
      description="Something went wrong on our end. Try again, or head back home."
      primaryAction={{ label: "Go home", href: "/" }}
    >
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Try again
      </button>
    </StatusScreen>
  );
}
