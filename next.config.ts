import type { NextConfig } from "next";

function mediaRemotePatterns(): { protocol: "https"; hostname: string }[] {
  const patterns: { protocol: "https"; hostname: string }[] = [
    { protocol: "https", hostname: "*.r2.dev" },
  ];

  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (base) {
    try {
      patterns.unshift({
        protocol: "https",
        hostname: new URL(base).hostname,
      });
    } catch {
      // Ignore invalid env during config load; *.r2.dev still covers public URLs.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: mediaRemotePatterns(),
  },
};

export default nextConfig;
