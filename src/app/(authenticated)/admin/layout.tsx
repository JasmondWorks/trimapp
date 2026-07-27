import type { ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { NavLink } from "@/components/NavLink";
import { RequireRole } from "@/components/RequireRole";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <RequireRole anyOf={["admin"]} redirectTo="/">
          <nav className="flex flex-wrap gap-4 border-b border-border pb-4 mb-6 text-sm">
            <NavLink href="/admin" exact>
              Overview
            </NavLink>
            <NavLink href="/admin/vendors">Vendors</NavLink>
            <NavLink href="/admin/orders">Orders</NavLink>
            <NavLink href="/admin/bookings">Bookings</NavLink>
          </nav>
          {children}
        </RequireRole>
      </div>
    </div>
  );
}
