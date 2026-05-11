import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Profile uploads allow up to 2 MiB file + multipart overhead */
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    /**
     * Vercel Blob public URLs are used in production for hero/product
     * uploads. `next/image` (used by the LCP hero banner) requires the host
     * to be allowlisted; project-scoped subdomains end with
     * `.public.blob.vercel-storage.com`.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
