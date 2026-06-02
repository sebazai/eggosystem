import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const isBindMountDev =
  process.env.WATCHPACK_POLLING === "true" ||
  process.env.DEVCONTAINER === "true" ||
  fs.existsSync("/.dockerenv");

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  turbopack: {
    root: path.join(__dirname, "..", "..")
  },
  webpack: (config, { dev }) => {
    // Bind-mounted workspaces (DevContainer / Docker Desktop) often miss inotify events.
    if (dev && isBindMountDev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300
      };
    }
    return config;
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
