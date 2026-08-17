"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira } from "@/lib/format";
import { useCurrentUser } from "@/models/auth/auth.hooks";
import { useVendor } from "@/models/vendor/vendor.hooks";
import { useVendorServices } from "@/models/service/service.hooks";
import { useReviews } from "@/models/review/review.hooks";
import { useCreateBooking } from "@/models/booking/booking.hooks";
import { DEFAULT_BOOKING_TIME } from "@/models/booking/booking.constants";
import { toast } from "sonner";
import { ShieldCheck, Star, MapPin, Clock, Loader2 } from "lucide-react";

export default VendorProfile;

function VendorProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();

  const { vendor, isLoading } = useVendor(id);
  const { services } = useVendorServices(id);
  const { reviews } = useReviews("vendor", id);
  const { createBooking, isBooking } = useCreateBooking();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState<string>(DEFAULT_BOOKING_TIME);
  const [mode, setMode] = useState<"in_shop" | "home">("in_shop");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const selectedService = useMemo(
    () => services?.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  const handleBook = async () => {
    if (!user) return toast.error("Please sign in first");
    if (!selectedService || !vendor) return toast.error("Pick a service");
    try {
      // Price and commission are computed server-side from the service and
      // vendor rows, so nothing about the amount is sent from here.
      await createBooking({
        vendorId: vendor.id,
        serviceId: selectedService.id,
        date,
        time,
        mode,
        address: mode === "home" ? address : undefined,
        notes,
      });
      toast.success("Booking requested. The vendor will confirm.");
      router.push("/bookings");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (isLoading)
    return (
      <>
        <SiteHeader />
        <div className="p-8 text-muted-foreground">Loading…</div>
      </>
    );
  if (!vendor)
    return (
      <>
        <SiteHeader />
        <div className="p-8">Vendor not found.</div>
      </>
    );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="relative h-56 bg-muted">
        {vendor.cover_url && (
          <img
            src={vendor.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-12">
        <div className="rounded-lg border border-border bg-card p-6 flex flex-wrap items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden border-4 border-card">
            {vendor.avatar_url && (
              <img
                src={vendor.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl">{vendor.business_name}</h1>
              {vendor.is_verified && (
                <ShieldCheck
                  className="h-5 w-5 text-primary"
                  aria-label="Verified"
                />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="capitalize">
                {vendor.category}
              </Badge>
              {vendor.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {vendor.address}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-primary text-primary" />{" "}
                {vendor.rating.toFixed(1)} ({vendor.reviews_count})
              </span>
            </div>
            {vendor.bio && (
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
                {vendor.bio}
              </p>
            )}
          </div>
        </div>

        {vendor.portfolio_urls?.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl mb-3">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {vendor.portfolio_urls
                .slice(0, 8)
                .map((url: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-square rounded-md overflow-hidden bg-muted"
                  >
                    <img
                      src={url}
                      alt={`Portfolio ${i}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </section>
        )}

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* Services list */}
          <div className="md:col-span-2">
            <h2 className="font-display text-2xl mb-3">Services</h2>
            {services && services.length > 0 ? (
              <div className="space-y-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full text-left rounded-md border p-4 flex items-center gap-4 transition ${
                      selectedServiceId === s.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{s.name}</p>
                      {s.description && (
                        <p className="text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {s.duration_minutes} min
                      </p>
                    </div>
                    <p className="font-display text-lg text-primary">
                      {formatNaira(s.price)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No services listed yet.</p>
            )}

            <h2 className="font-display text-2xl mt-10 mb-3">Reviews</h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex items-center gap-1 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            )}
          </div>

          {/* Booking */}
          <aside className="rounded-lg border border-border bg-card p-5 h-fit sticky top-20">
            <h3 className="font-display text-xl mb-3">Book this vendor</h3>
            {!user ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in to book an appointment.
                </p>
                <Button
                  asChild
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/auth">Sign in</Link>
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Service</Label>
                  <p className="text-sm mt-1">
                    {selectedService ? (
                      <span>
                        {selectedService.name} —{" "}
                        <span className="text-primary">
                          {formatNaira(selectedService.price)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Pick a service on the left
                      </span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="d">Date</Label>
                    <Input
                      id="d"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="t">Time</Label>
                    <Input
                      id="t"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
                {(vendor.service_mode === "home" ||
                  vendor.service_mode === "both") && (
                  <div>
                    <Label>Location</Label>
                    <Select
                      value={mode}
                      onValueChange={(v) => setMode(v as "in_shop" | "home")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vendor.service_mode === "both" && (
                          <SelectItem value="in_shop">In-shop</SelectItem>
                        )}
                        <SelectItem value="home">Home service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {mode === "home" && (
                  <div>
                    <Label htmlFor="a">Your address</Label>
                    <Input
                      id="a"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, area, city"
                      required
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="n">Notes (optional)</Label>
                  <Textarea
                    id="n"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  disabled={!selectedService || isBooking}
                  onClick={() => void handleBook()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isBooking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Request booking"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll pay after the vendor confirms. Paystack coming soon.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
