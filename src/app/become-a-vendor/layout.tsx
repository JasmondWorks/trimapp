import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Become a vendor — TrimApp",
  description: "List your barbing or hairdressing business on TrimApp.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
