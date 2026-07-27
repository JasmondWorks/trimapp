import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Shop wigs & kits — TrimApp",
  description: "Browse wigs, clippers and grooming kits from verified Nigerian vendors.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
