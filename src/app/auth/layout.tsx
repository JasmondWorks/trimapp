import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign in — TrimApp",
  description: "Sign in or create a TrimApp account to book and shop.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
