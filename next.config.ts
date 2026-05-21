import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // geoip-lite ships binary .dat databases that it loads by relative path at
  // runtime; bundling it breaks those paths. Keep it external so it resolves
  // from node_modules instead.
  serverExternalPackages: ["geoip-lite"],
};

export default nextConfig;
