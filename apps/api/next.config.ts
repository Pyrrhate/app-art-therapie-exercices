import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Trace les deps depuis la racine du monorepo (npm workspaces). */
  outputFileTracingRoot: monorepoRoot,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.join(monorepoRoot, "node_modules/react"),
      "react-dom": path.join(monorepoRoot, "node_modules/react-dom"),
    };
    return config;
  },
};

export default nextConfig;
