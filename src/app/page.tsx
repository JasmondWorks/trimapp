import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { MapPin, ShoppingBag, Scissors, Star, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrimApp — Book barbers & hairdressers in Nigeria",
  description:
    "Find nearby barbers and hairdressers, book appointments, and shop wigs and grooming kits — all in Naira.",
  openGraph: {
    title: "TrimApp — Nigeria's barber & hairdresser marketplace",
    description: "Book chairs and shop kits, from Lagos to Kano.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/40 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-primary text-xs tracking-[0.25em] uppercase mb-4">
              For Nigeria, by Nigerians
            </p>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Book your next cut. Shop the tools. All in one place.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              TrimApp connects you with vetted barbers and hairdressers near
              you, plus a curated marketplace of wigs and barbering kits —
              priced in Naira, delivered nationwide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/discover">Salons near me</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/shop">Shop kits & wigs</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/become-a-vendor">List your shop</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: MapPin,
              title: "Find your local",
              body: "Share your location and see the closest salons — with real distance and ratings.",
            },
            {
              icon: Scissors,
              title: "Book in seconds",
              body: "Pick a service, a time slot, and confirm. In-shop or home service — you choose.",
            },
            {
              icon: ShoppingBag,
              title: "Shop what pros use",
              body: "Wigs, clippers, and full kits — from the TrimApp store and independent vendors.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg bg-card border border-border p-6"
            >
              <Icon className="h-6 w-6 text-primary mb-4" />
              <h3 className="font-display text-xl mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <p className="text-primary text-xs tracking-[0.25em] uppercase mb-3">
              Verified vendors
            </p>
            <h2 className="font-display text-3xl sm:text-4xl mb-4">
              Trust, built in.
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Every vendor is reviewed by our team before going live. Look for
              the verified badge, read real customer ratings, and pay securely.
            </p>
            <div className="mt-6 flex gap-6 text-sm">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Vetted vendors
              </span>
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" /> Real reviews
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/70 p-8 border border-border">
            <p className="font-display text-2xl mb-2">
              Are you a barber or hairdresser?
            </p>
            <p className="text-muted-foreground mb-6">
              Get discovered, manage your bookings, and sell wigs or kits
              alongside your services.
            </p>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/become-a-vendor">Become a vendor</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-sm text-muted-foreground flex flex-wrap justify-between gap-4">
          <span>© {new Date().getFullYear()} TrimApp</span>
          <span>Made for Nigeria 🇳🇬</span>
        </div>
      </footer>
    </div>
  );
}
