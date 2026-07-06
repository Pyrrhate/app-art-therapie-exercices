import path from "node:path";
import type { NextConfig } from "next";

/** API serverless — monorepo : tracer depuis la racine du dépôt. */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
