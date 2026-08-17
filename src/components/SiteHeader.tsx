"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "./CartDrawer";
import { Scissors, Menu } from "lucide-react";
import { useRoles, useSignOut } from "@/models/auth/auth.hooks";
import { useUiStore } from "@/stores/ui.store";

type NavLinksProps = {
  user: unknown;
  isVendor: boolean;
  isAdmin: boolean;
  onClick?: () => void;
};

function NavLinks({ user, isVendor, isAdmin, onClick }: NavLinksProps) {
  return (
    <>
      <Link
        href="/discover"
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground"
      >
        Discover
      </Link>
      <Link
        href="/shop"
        onClick={onClick}
        className="text-muted-foreground hover:text-foreground"
      >
        Shop
      </Link>
      {user && (
        <>
          <Link
            href="/bookings"
            onClick={onClick}
            className="text-muted-foreground hover:text-foreground"
          >
            Bookings
          </Link>
          <Link
            href="/orders"
            onClick={onClick}
            className="text-muted-foreground hover:text-foreground"
          >
            Orders
          </Link>
        </>
      )}
      {isVendor && (
        <Link
          href="/vendor"
          onClick={onClick}
          className="text-primary font-medium hover:opacity-80"
        >
          Vendor
        </Link>
      )}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onClick}
          className="text-primary font-medium hover:opacity-80"
        >
          Admin
        </Link>
      )}
    </>
  );
}

export function SiteHeader() {
  const { user, isVendor, isAdmin } = useRoles();
  const { signOut } = useSignOut();
  const router = useRouter();
  const open = useUiStore((s) => s.isMobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            TrimApp
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLinks user={user} isVendor={isVendor} isAdmin={isAdmin} />
        </nav>

        <div className="flex items-center gap-2">
          <CartDrawer />
          {user ? (
            <>
              <Link href="/account" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Account
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:inline-flex"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button
              asChild
              size="sm"
              className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/auth">Sign in</Link>
            </Button>
          )}
          <button
            aria-label="Menu"
            className="md:hidden p-2"
            onClick={() => setOpen(!open)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3 text-sm">
            <NavLinks
              user={user}
              isVendor={isVendor}
              isAdmin={isAdmin}
              onClick={() => setOpen(false)}
            />
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground"
                >
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-left text-muted-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="text-primary font-medium"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
