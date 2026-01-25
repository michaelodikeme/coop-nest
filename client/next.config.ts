import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
  /* config options here */
  // allowedDevOrigins: [
  //   'http://localhost:3000',
  //   'http://192.168.158.126:3000',
  // ]
};

export default nextConfig;
