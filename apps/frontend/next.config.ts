import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@eggosystem/types"],
  eslint: {
    dirs: ["src"]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "stats.kanaliiga.fi"
      }
    ]
  }
};

export default nextConfig;
