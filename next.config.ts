import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Negotiated per request; AVIF first, WebP as the fallback.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2560],
    // No remotePatterns: reviewer avatars are downloaded during
    // `npm run reviews:refresh`, so every image the site serves is local.
    imageSizes: [40, 80, 180, 260, 360, 480],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
