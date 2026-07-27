import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TrimApp — Book barbers & hairdressers, shop wigs & kits",
  description:
    "Nigeria's marketplace for barbers, hairdressers, wigs and grooming kits — find nearby salons, book instantly, pay in Naira.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "TrimApp — Nigeria's barber & hairdresser marketplace",
    description: "Book a chair. Shop the kit. All in one app.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C2410C",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
