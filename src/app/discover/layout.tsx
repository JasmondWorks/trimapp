import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Discover salons — TrimApp",
  description: "Find nearby barbers and hairdressers, filtered by distance, category and state.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
