import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
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
      }
    ]
  }
};

export default nextConfig;
