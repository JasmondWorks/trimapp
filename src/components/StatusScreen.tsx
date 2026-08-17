import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The shared full-page state used by every terminal screen — 404, 401, 403 and
 * the root error boundary. One component so the four never drift apart in tone
 * or spacing, and so a design change lands in one place.
 */
export function StatusScreen({
  code,
  title,
  description,
  primaryAction = { label: "Back home", href: "/" },
  secondaryAction,
  children,
}: {
  /** Big display numeral, e.g. "404". Omit for non-HTTP states. */
  code?: string;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  /** Rendered below the actions — used for the error boundary's retry button. */
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {code && <p className="font-display text-7xl font-bold text-primary">{code}</p>}
        <h1 className="mt-4 font-display text-xl text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {children}
          <Link
            href={primaryAction.href}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {primaryAction.label}
          </Link>
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
