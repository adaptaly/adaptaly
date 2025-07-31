import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Treat canvas as an external Node module
      config.externals.push({ canvas: "commonjs canvas" });
    }

    // Add a rule to handle .node binaries
    config.module.rules.push({
      test: /\.node$/,
      use: "raw-loader",
    });

    return config;
  },
};

export default nextConfig;