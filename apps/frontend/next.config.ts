import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  turbopack: {
    root: path.join(__dirname, "..", "..")
  },
  experimental: {
    turbopackFileSystemCacheForDev: false
  },
  transpilePackages: [
    "@eggosystem/types",
    "@eggosystem/eslint",
    "@eggosystem/viewer"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.allstar.gg"
      },
      {
        protocol: "https",
        hostname: "imgdev.kanaliiga.fi"
      },
      {
        protocol: "https",
        hostname: "img.kanaliiga.fi"
      },
      {
        protocol: "https",
        hostname: "imgstage.kanaliiga.fi"
      },
      {
        protocol: "https",
        hostname: "media.licdn.com"
      }
    ]
  }
};

export default nextConfig;
