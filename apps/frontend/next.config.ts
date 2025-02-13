import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: [
    "@eggosystem/ui",
    "@eggosystem/utils",
    "@eggosystem/types",
  ],
  eslint: {
    dirs: ["src"],
  },
};

export default nextConfig;
