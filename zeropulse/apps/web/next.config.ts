import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zeropulse/db"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  output: "standalone",
};

export default nextConfig;
