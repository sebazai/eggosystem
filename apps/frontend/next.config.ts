import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  transpilePackages: ["@eggosystem/types", "@eggosystem/eslint"],
  eslint: {
    dirs: ["src"],
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mediacdn.allstar.gg"
      }
    ]
  }
};

export default nextConfig;
