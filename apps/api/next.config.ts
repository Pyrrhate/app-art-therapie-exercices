import type { NextConfig } from "next";

/** API serverless — pas de pages statiques. */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
