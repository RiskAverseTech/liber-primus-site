import type { NextConfig } from "next";

// A fully static export: every page is rendered at build time from the
// content the sync script fetched, and no server runs in production.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  reactStrictMode: true,
};

export default nextConfig;
