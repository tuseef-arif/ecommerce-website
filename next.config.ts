import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Profile uploads allow up to 2 MiB file + multipart overhead */
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
