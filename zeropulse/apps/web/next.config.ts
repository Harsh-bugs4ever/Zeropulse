import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zeropulse/db"],
  serverExternalPackages: ["@prisma/client"],
  output: "standalone",
};

export default nextConfig;
