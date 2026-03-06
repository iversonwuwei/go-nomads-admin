import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  turbopack: {
    // Explicit root to silence multi-lockfile warning in monorepo
    root: __dirname,
  },
  experimental: {
    optimizeCss: {
      // Allow CSS Houdini @property in DaisyUI radialprogress
      lightningcss: {
        drafts: { customProperties: true },
      },
    },
  },
};

export default nextConfig;
