import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow connections from the local IP addressing the HMR block
  experimental: {
    // Some next.config implementations prefer it under experimental
  },
  // As prompted by Next.js dev server:
  allowedDevOrigins: ['192.168.0.154', 'localhost', '127.0.0.1'],
};

export default nextConfig;
