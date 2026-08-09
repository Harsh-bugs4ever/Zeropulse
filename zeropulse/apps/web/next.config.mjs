/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zeropulse/db"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
