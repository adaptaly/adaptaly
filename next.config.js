/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // avoids ESLint blocking builds
  },
};

module.exports = nextConfig;