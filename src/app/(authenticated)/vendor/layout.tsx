import type { ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { NavLink } from "@/components/NavLink";
import { RequireRole } from "@/components/RequireRole";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <RequireRole anyOf={["vendor", "admin"]} redirectTo="/become-a-vendor">
          <nav className="flex flex-wrap gap-4 border-b border-border pb-4 mb-6 text-sm">
            <NavLink href="/vendor" exact>
              Dashboard
            </NavLink>
            <NavLink href="/vendor/profile">Profile</NavLink>
            <NavLink href="/vendor/services">Services</NavLink>
            <NavLink href="/vendor/products">Products</NavLink>
            <NavLink href="/vendor/bookings">Bookings</NavLink>
            <NavLink href="/vendor/orders">Orders</NavLink>
          </nav>
          {children}
        </RequireRole>
      </div>
    </div>
  );
}
