import type { ReactNode } from "react";

import { RequireRole } from "@/components/RequireRole";

/**
 * Everything in this group requires a signed-in user. Nested vendor/admin
 * layouts narrow this further to specific roles.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <RequireRole redirectTo="/auth">{children}</RequireRole>;
}
