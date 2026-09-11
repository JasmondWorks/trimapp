import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads are routed through server actions, and the default cap is 1MB —
      // below the bucket's own 5MB limit, so a valid image would be rejected by
      // the framework before it ever reached storage.
      bodySizeLimit: "6mb",
    },
    // Enables `unauthorized()` / `forbidden()` from next/navigation and the
    // app/unauthorized.tsx and app/forbidden.tsx boundaries they render.
    authInterrupts: true,
  },
};

export default nextConfig;
