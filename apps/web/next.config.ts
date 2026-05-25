import type { NextConfig } from "next";

// Baseline security headers applied to every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // geoip-lite ships binary .dat databases that it loads by relative path at
  // runtime; bundling it breaks those paths. Keep it external so it resolves
  // from node_modules instead.
  serverExternalPackages: ["geoip-lite"],
  // Workspace packages ship raw TypeScript via their "exports" field. Next
  // needs them in transpilePackages so it runs them through SWC.
  transpilePackages: ["@cortala/schemas"],
  // The web app reads webhook schemas as well; they live in the same
  // workspace package, so the transpile entry above already covers them.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
