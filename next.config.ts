import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enables `unauthorized()` / `forbidden()` from next/navigation and the
    // app/unauthorized.tsx and app/forbidden.tsx boundaries they render.
    authInterrupts: true,
  },
};

export default nextConfig;
