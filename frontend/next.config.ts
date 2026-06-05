// frontend/next.config.ts
import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // not using PWA while local dev  mode
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for a small Docker image.
  output: "standalone",
};

export default withPWA(nextConfig);