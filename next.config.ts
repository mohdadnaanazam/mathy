import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Bundle analyzer configuration
// Run with: npm run analyze (Linux/Mac) or npm run analyze:win (Windows)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
