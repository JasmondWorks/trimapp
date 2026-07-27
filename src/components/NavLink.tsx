"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Replacement for TanStack Router's `activeProps` / `activeOptions`. */
export function NavLink({
  href,
  exact = false,
  children,
}: {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={
        active
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}
