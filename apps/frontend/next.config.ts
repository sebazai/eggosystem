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
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/images/**",
        search: ""
      },
      {
        protocol: "https",
        hostname: "stats.kanaliiga.fi"
      }
    ]
  }
};

export default nextConfig;
